import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  ServiceUnavailableException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
import * as assert from 'assert';
import { IMe } from 'src/common/graphql/interface/context.interface';
import { ArticleService } from 'src/core/article/services/article.service';
import { ArticleStatusEnum } from 'src/core/article/enum/article.status.enum';
import { ARTICLE_SUBMITTED_EVENT } from 'src/core/article/article.events';
import { PublicationService } from 'src/core/publication/services/publication.service';
import { PaymentOrder, PaymentOrderStatusEnum } from '../razorpay/payment.order.schema';
import { PaymentFulfilService, PaymentResult } from '../razorpay/payment.fulfil.service';
import { ShopifyClient } from './shopify.client';
import { PaymentAccessService } from '../access/payment.access.service';

const PROVIDER = 'SHOPIFY';
const DRAFT_ID = /^gid:\/\/shopify\/DraftOrder\//;
const toPaise = (amount: string) => Math.round(Number(amount) * 100);

// Pay for a PR on Shopify's checkout: draft order (full PR amount in INR) ->
// the user pays on Shopify -> we ask Shopify whether it is paid -> credits -> submit.
// Also: refunds / cancellations on Shopify take the credits back (or flag for an admin),
// and checkouts that should no longer be paid are deleted.
@Injectable()
export class ShopifyService implements OnApplicationBootstrap {
  private _logger = new Logger(ShopifyService.name);

  constructor(
    @InjectModel(PaymentOrder.name) private model: Model<PaymentOrder>,
    private client: ShopifyClient,
    private articleService: ArticleService,
    private publicationService: PublicationService,
    private fulfil: PaymentFulfilService,
    private access: PaymentAccessService
  ) {}

  get enabled() {
    return this.client.enabled;
  }

  // Development store = test payments only: only test accounts may use it
  testMode(): Promise<boolean> {
    return this.client.isTestStore();
  }

  // Shown on the payment page only for accounts allowed to pay (PAYMENT_ALLOWED_USERS)
  async availableFor(userId: string) {
    return this.enabled && (await this.access.canPay(userId, await this.testMode()));
  }

  // On start (when SHOPIFY_WEBHOOK_URL is set): make sure Shopify sends paid / refund /
  // cancelled events to us. Never blocks or breaks the start.
  onApplicationBootstrap() {
    const uri = this.client.webhookUrl;
    if (!this.enabled || !uri) return;
    this.client
      .ensureWebhooks(uri)
      .then((created) =>
        this._logger.log(`Shopify webhooks ready (${created.length ? 'created ' + created.join(', ') : 'all existed'}): ${uri}`)
      )
      .catch((e) => this._logger.error(`Shopify webhook registration failed: ${e.message}`));
  }

  // Returns the Shopify checkout link for this PR (reuses an open one when nothing changed)
  async createCheckout(articleId: string, me: IMe) {
    assert(this.enabled, new BadRequestException('Shopify is not available right now'));
    await this.access.assertCanPay(me.userId, await this.testMode());
    const article = await this.articleService.getById(articleId, me);
    assert(article && article.userId === me.userId, new NotFoundException('PR not found'));
    assert(
      article.status === ArticleStatusEnum.DRAFT,
      new BadRequestException('This PR has already been submitted')
    );
    // Never take money for a PR that cannot be submitted (e.g. a deleted publication)
    await this.articleService.assertMediaAvailable(article);
    // Today's prices (not the ones saved when the PR was made)
    const credits = await this.articleService.refreshTotal(article);
    assert(credits > 0, new BadRequestException('Select at least one publication'));
    const rate = (await this.publicationService.getSettings()).usdInrRate;
    const amount = Math.round(credits * rate * 100); // paise

    const open = await this.model.findOne(
      {
        articleId,
        userId: me.userId,
        provider: PROVIDER,
        status: PaymentOrderStatusEnum.PENDING,
        credits,
        amount,
        gatewayOrderId: DRAFT_ID
      },
      null,
      { sort: { createdAt: -1 } }
    );
    if (open) {
      try {
        const draft = await this.client.getDraftOrder(open.gatewayOrderId);
        if (draft && draft.status !== 'COMPLETED' && draft.invoiceUrl)
          return this.view(open, draft.invoiceUrl);
      } catch (e) {
        this._logger.warn(`Could not reuse Shopify draft ${open.gatewayOrderId}: ${e.message}`);
      }
    }
    // Only one payable checkout per PR: close older ones (e.g. made before the media changed)
    await this.cancelOpenCheckouts(articleId);

    const created = await this.model.create({
      provider: PROVIDER,
      userId: me.userId,
      articleId,
      prId: article.prId,
      credits,
      amount,
      rate,
      // placeholder until Shopify returns the draft order id
      gatewayOrderId: `pending:shopify:${articleId}:${Date.now()}`
    });
    try {
      const draft = await this.client.createDraftOrder({
        title: `01 Wire PR #${article.prId} – ${(article.title || 'Press release').slice(0, 120)}`,
        amount: (amount / 100).toFixed(2),
        currency: 'INR',
        note: `01 Wire press release payment: PR #${article.prId}, ${credits} credits at ₹${rate}/credit`,
        tags: ['01wire', `pr-${article.prId}`],
        attributes: [
          { key: 'paymentOrderId', value: created._id },
          { key: 'articleId', value: articleId },
          { key: 'prId', value: String(article.prId) }
        ]
      });
      const total = draft.totalPriceSet?.shopMoney;
      assert(
        total && toPaise(total.amount) === amount && total.currencyCode === 'INR',
        new Error(`draft total ${total?.amount} ${total?.currencyCode} does not match ${amount / 100} INR`)
      );
      await this.model.updateOne({ _id: created._id }, { $set: { gatewayOrderId: draft.id } });
      return this.view({ ...created.toObject(), gatewayOrderId: draft.id } as any, draft.invoiceUrl);
    } catch (e) {
      await this.model.deleteOne({ _id: created._id });
      this._logger.error(`Shopify checkout failed: ${e?.response?.data ? JSON.stringify(e.response.data).slice(0, 300) : e.message}`);
      throw new BadRequestException('Could not start the Shopify payment. Please try again.');
    }
  }

  // Asks Shopify whether the latest checkout for this PR is paid; if so adds the
  // credits (once) and submits the PR. Called by the payment page while it waits.
  async checkStatus(articleId: string, me: IMe): Promise<PaymentResult> {
    const paid = await this.model.findOne(
      { articleId, userId: me.userId, status: PaymentOrderStatusEnum.PAID },
      null,
      { sort: { paidAt: -1 } }
    );
    if (paid) return this.fulfil.resultFor(paid);

    const pending = await this.model.findOne(
      {
        articleId,
        userId: me.userId,
        provider: PROVIDER,
        status: PaymentOrderStatusEnum.PENDING,
        gatewayOrderId: DRAFT_ID
      },
      null,
      { sort: { createdAt: -1 } }
    );
    if (!pending) return { status: 'PENDING', submitted: false, message: 'No Shopify payment started yet' };
    return this.confirm(pending);
  }

  // The PR was submitted (any way: credits, Razorpay, Shopify): its other Shopify
  // checkouts must not be payable any more, or the customer could pay twice.
  @OnEvent(ARTICLE_SUBMITTED_EVENT, { async: true })
  async onArticleSubmitted({ articleId }: { articleId: string }) {
    if (!this.enabled || !articleId) return;
    try {
      await this.cancelOpenCheckouts(articleId);
    } catch (e) {
      this._logger.error(`Closing Shopify checkouts for PR ${articleId} failed: ${e.message}`);
    }
  }

  // Deletes the still-open Shopify checkouts of a PR. A checkout that turns out to be
  // paid already is processed normally (credits; flagged if the PR can't take it).
  async cancelOpenCheckouts(articleId: string) {
    const open = await this.model.find({
      articleId,
      provider: PROVIDER,
      status: PaymentOrderStatusEnum.PENDING,
      gatewayOrderId: DRAFT_ID
    });
    for (const p of open) {
      const draft = await this.client.getDraftOrder(p.gatewayOrderId);
      if (draft?.status === 'COMPLETED') {
        await this.confirm(p).catch((e) => this._logger.warn(`Paid checkout ${p._id}: ${e.message}`));
        continue;
      }
      if (draft) await this.client.deleteDraftOrder(p.gatewayOrderId);
      await this.model.updateOne(
        { _id: p._id, status: PaymentOrderStatusEnum.PENDING },
        { $set: { status: PaymentOrderStatusEnum.CANCELLED } }
      );
      this._logger.log(`Closed Shopify checkout ${draft?.name || p.gatewayOrderId} for PR #${p.prId}`);
    }
  }

  // Shopify webhooks (signature already checked by the controller). The body only tells
  // us which payment to look at; amounts and states are always read from Shopify itself.
  async handleWebhook(topic: string, shopDomain: string, body: any): Promise<{ ok: boolean }> {
    if (!this.client.isOurShop(shopDomain)) {
      this._logger.warn(`Shopify webhook from another shop ignored: ${shopDomain}`);
      return { ok: true };
    }
    if (topic === 'refunds/create') return this.onRefund(body?.order_id);
    if (topic === 'orders/cancelled') return this.onCancelled(body?.id);
    if (topic !== 'orders/paid') return { ok: true };

    const attrs: { name: string; value: string }[] = body?.note_attributes || [];
    const ref = attrs.find((a) => a?.name === 'paymentOrderId')?.value;
    let candidates: PaymentOrder[] = [];
    if (ref) {
      const p = await this.model.findOne({ _id: ref, provider: PROVIDER });
      if (p) candidates = [p];
    } else {
      // Fallback: our tag "pr-<n>" -> open Shopify payments for that PR
      const prId = Number(String(body?.tags || '').match(/(?:^|,\s*)pr-(\d+)/)?.[1]);
      if (prId)
        candidates = await this.model.find({
          prId,
          provider: PROVIDER,
          status: { $in: [PaymentOrderStatusEnum.PENDING, PaymentOrderStatusEnum.CANCELLED] },
          gatewayOrderId: DRAFT_ID
        });
    }
    if (!candidates.length) {
      this._logger.log(`Shopify order ${body?.name || body?.id} is not a 01 Wire payment`);
      return { ok: true };
    }
    for (const p of candidates) {
      if (p.status === PaymentOrderStatusEnum.PAID) continue;
      let r: PaymentResult;
      try {
        r = await this.confirm(p);
      } catch (e) {
        // A mismatch will never succeed (already flagged): don't make Shopify retry
        if (e instanceof BadRequestException) {
          this._logger.error(`Shopify webhook: payment ${p._id} rejected: ${e.message}`);
          continue;
        }
        throw e; // Shopify API down etc.: a non-2xx makes Shopify retry later
      }
      if (r.status === 'PAID') {
        this._logger.log(`Shopify webhook: PR #${p.prId} paid (submitted: ${r.submitted})`);
        return { ok: true };
      }
    }
    // Paid on Shopify but not visible as paid yet: ask Shopify to send it again later
    const fresh = ref ? await this.model.findOne({ _id: ref }) : null;
    if (fresh?.status === PaymentOrderStatusEnum.PENDING)
      throw new ServiceUnavailableException('Payment not confirmed yet');
    return { ok: true };
  }

  // Money went back to the customer on Shopify: take back the matching credits (shared step;
  // the refunded total is read from Shopify, only the new part counts).
  private async onRefund(orderNumericId: number | string) {
    if (!orderNumericId) return { ok: true };
    const gid = `gid://shopify/Order/${orderNumericId}`;
    const payment = await this.model.findOne({ provider: PROVIDER, gatewayPaymentId: gid, status: PaymentOrderStatusEnum.PAID });
    if (!payment) return { ok: true }; // not ours, or never credited (nothing to take back)
    const order = await this.client.getOrder(gid);
    await this.fulfil.applyRefund(payment, toPaise(order?.totalRefundedSet?.shopMoney?.amount || '0'), 'Shopify', order?.name || gid);
    return { ok: true };
  }

  // Cancelled on Shopify. With a refund, onRefund takes the credits back; a cancel
  // without (full) refund needs a person to decide.
  private async onCancelled(orderNumericId: number | string) {
    if (!orderNumericId) return { ok: true };
    const gid = `gid://shopify/Order/${orderNumericId}`;
    const payment = await this.model.findOne({ provider: PROVIDER, gatewayPaymentId: gid });
    if (!payment) return { ok: true };
    const order = await this.client.getOrder(gid);
    const refunded = toPaise(order?.totalRefundedSet?.shopMoney?.amount || '0');
    if (order?.cancelledAt && refunded < payment.amount)
      await this.fulfil.flag(
        payment,
        `Shopify order ${order.name} was cancelled (refunded ₹${(refunded / 100).toFixed(2)} of ₹${(payment.amount / 100).toFixed(2)}).`
      );
    return { ok: true };
  }

  // Asks Shopify whether this checkout is paid (amount + currency checked) and, if so,
  // adds the credits once and submits the PR. Used by the page's polling and the webhook.
  private async confirm(pending: PaymentOrder): Promise<PaymentResult> {
    assert(this.enabled, new BadRequestException('Shopify is not available right now'));

    const draft = await this.client.getDraftOrder(pending.gatewayOrderId);
    const order = draft?.order;
    if (!draft || draft.status !== 'COMPLETED' || !order)
      return { status: 'PENDING', submitted: false, message: 'Waiting for the payment on Shopify' };
    if (order.displayFinancialStatus !== 'PAID') {
      // Refunded / voided before we credited it: nothing to add, but someone should know
      if (/REFUND|VOID/.test(order.displayFinancialStatus))
        await this.fulfil.flag(pending, `Shopify order ${order.name} is ${order.displayFinancialStatus.toLowerCase()} before it was credited.`);
      return {
        status: 'PENDING',
        submitted: false,
        message: `Shopify shows the payment as ${order.displayFinancialStatus.toLowerCase().replace(/_/g, ' ')}`
      };
    }
    const total = order.totalPriceSet?.shopMoney;
    if (!(total && toPaise(total.amount) === pending.amount && total.currencyCode === pending.currency)) {
      await this.fulfil.flag(
        pending,
        `Shopify order ${order.name} was paid ${total?.amount} ${total?.currencyCode} but this checkout expects ₹${(pending.amount / 100).toFixed(2)}. No credits were added.`
      );
      throw new BadRequestException('Payment does not match this order');
    }
    // Money confirmed by Shopify: add the credits once and submit the PR
    return this.fulfil.claimAndFulfil(pending, order.id, 'Shopify', {
      gatewayRef: order.name,
      test: !!order.test || (await this.testMode())
    });
  }

  private view(p: PaymentOrder, checkoutUrl: string) {
    return {
      checkoutUrl,
      amount: p.amount,
      currency: p.currency || 'INR',
      credits: p.credits,
      prId: p.prId
    };
  }
}
