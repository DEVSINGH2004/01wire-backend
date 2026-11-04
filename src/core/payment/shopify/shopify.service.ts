import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as assert from 'assert';
import { IMe } from 'src/common/graphql/interface/context.interface';
import { ArticleService } from 'src/core/article/services/article.service';
import { ArticleStatusEnum } from 'src/core/article/enum/article.status.enum';
import { PublicationService } from 'src/core/publication/services/publication.service';
import { PaymentOrder, PaymentOrderStatusEnum } from '../razorpay/payment.order.schema';
import { PaymentFulfilService, PaymentResult } from '../razorpay/payment.fulfil.service';
import { ShopifyClient } from './shopify.client';

const PROVIDER = 'SHOPIFY';
const DRAFT_ID = /^gid:\/\/shopify\/DraftOrder\//;
const toPaise = (amount: string) => Math.round(Number(amount) * 100);

// Pay for a PR on Shopify's checkout: draft order (full PR amount in INR) ->
// the user pays on Shopify -> we ask Shopify whether it is paid -> credits -> submit.
@Injectable()
export class ShopifyService {
  private _logger = new Logger(ShopifyService.name);

  constructor(
    @InjectModel(PaymentOrder.name) private model: Model<PaymentOrder>,
    private client: ShopifyClient,
    private articleService: ArticleService,
    private publicationService: PublicationService,
    private fulfil: PaymentFulfilService
  ) {}

  get enabled() {
    return this.client.enabled;
  }

  // Returns the Shopify checkout link for this PR (reuses an open one when nothing changed)
  async createCheckout(articleId: string, me: IMe) {
    assert(this.enabled, new BadRequestException('Shopify is not available right now'));
    const article = await this.articleService.getById(articleId, me);
    assert(article && article.userId === me.userId, new NotFoundException('PR not found'));
    assert(
      article.status === ArticleStatusEnum.DRAFT,
      new BadRequestException('This PR has already been submitted')
    );
    const credits = article.totalCredits;
    assert(credits > 0, new BadRequestException('Select at least one publication'));
    // Never take money for a PR that cannot be submitted (e.g. a deleted publication)
    await this.articleService.assertMediaAvailable(article);
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
    assert(this.enabled, new BadRequestException('Shopify is not available right now'));

    const draft = await this.client.getDraftOrder(pending.gatewayOrderId);
    const order = draft?.order;
    if (!draft || draft.status !== 'COMPLETED' || !order)
      return { status: 'PENDING', submitted: false, message: 'Waiting for the payment on Shopify' };
    if (order.displayFinancialStatus !== 'PAID')
      return {
        status: 'PENDING',
        submitted: false,
        message: `Shopify shows the payment as ${order.displayFinancialStatus.toLowerCase()}`
      };
    const total = order.totalPriceSet?.shopMoney;
    assert(
      total && toPaise(total.amount) === pending.amount && total.currencyCode === pending.currency,
      new BadRequestException('Payment does not match this order')
    );
    // Money confirmed by Shopify: add the credits once and submit the PR
    return this.fulfil.claimAndFulfil(pending, order.id, 'Shopify');
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
