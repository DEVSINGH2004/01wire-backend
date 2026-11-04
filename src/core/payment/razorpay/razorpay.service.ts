import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as assert from 'assert';
import { IMe } from 'src/common/graphql/interface/context.interface';
import { ArticleService } from 'src/core/article/services/article.service';
import { ArticleStatusEnum } from 'src/core/article/enum/article.status.enum';
import { PublicationService } from 'src/core/publication/services/publication.service';
import { RazorpayClient } from './razorpay.client';
import { PaymentOrder, PaymentOrderStatusEnum } from './payment.order.schema';
import { PaymentFulfilService, PaymentResult } from './payment.fulfil.service';

export { PaymentResult };

@Injectable()
export class RazorpayService {
  private _logger = new Logger(RazorpayService.name);

  constructor(
    @InjectModel(PaymentOrder.name) private model: Model<PaymentOrder>,
    private client: RazorpayClient,
    private articleService: ArticleService,
    private publicationService: PublicationService,
    private fulfil: PaymentFulfilService
  ) {}

  get enabled() {
    return this.client.enabled;
  }

  async inrPerCredit() {
    return (await this.publicationService.getSettings()).usdInrRate;
  }

  // Starts a Razorpay payment for the full PR amount (credits x INR rate)
  async createOrder(articleId: string, me: IMe) {
    assert(
      this.enabled,
      new BadRequestException('Razorpay is not available right now')
    );
    const article = await this.articleService.getById(articleId, me);
    assert(
      article && article.userId === me.userId,
      new NotFoundException('PR not found')
    );
    assert(
      article.status === ArticleStatusEnum.DRAFT,
      new BadRequestException('This PR has already been submitted')
    );
    const credits = article.totalCredits;
    assert(
      credits > 0,
      new BadRequestException('Select at least one publication')
    );
    // Never take money for a PR that cannot be submitted (e.g. a deleted publication)
    await this.articleService.assertMediaAvailable(article);
    const rate = await this.inrPerCredit();
    const amount = Math.round(credits * rate * 100); // paise

    // Reuse the open order when nothing changed (e.g. the popup was closed)
    let payment = await this.model.findOne({
      articleId,
      userId: me.userId,
      status: PaymentOrderStatusEnum.PENDING,
      credits,
      amount,
      gatewayOrderId: /^order_/
    });
    if (!payment) {
      const created = await this.model.create({
        userId: me.userId,
        articleId,
        prId: article.prId,
        credits,
        amount,
        rate,
        // placeholder until Razorpay returns the order id
        gatewayOrderId: `pending:${articleId}:${Date.now()}`
      });
      const id = created._id;
      try {
        const order = await this.client.createOrder({
          amount,
          currency: 'INR',
          receipt: id,
          notes: {
            paymentOrderId: id,
            articleId,
            prId: String(article.prId),
            userId: me.userId
          }
        });
        payment = await this.model.findOneAndUpdate(
          { _id: id },
          { $set: { gatewayOrderId: order.id } },
          { new: true }
        );
      } catch (e) {
        await this.model.deleteOne({ _id: id });
        this._logger.error(
          `Razorpay order failed: ${
            e?.response?.data?.error?.description || e.message
          }`
        );
        throw new BadRequestException(
          'Could not start the payment. Please try again.'
        );
      }
    }
    return {
      keyId: this.client.keyId,
      orderId: payment.gatewayOrderId,
      amount: payment.amount,
      currency: payment.currency,
      credits: payment.credits,
      prId: payment.prId
    };
  }

  // Called by the browser after Razorpay checkout succeeds
  async verifyPayment(
    {
      orderId,
      paymentId,
      signature
    }: { orderId: string; paymentId: string; signature: string },
    me: IMe
  ): Promise<PaymentResult> {
    assert(
      this.client.isCheckoutSignatureValid(orderId, paymentId, signature),
      new BadRequestException('Payment could not be verified')
    );
    const payment = await this.model.findOne({
      gatewayOrderId: orderId,
      userId: me.userId
    });
    assert(!!payment, new NotFoundException('Payment not found'));
    return this.complete(payment, paymentId);
  }

  // Razorpay webhook; the body signature is checked by the controller
  async handleWebhook(body: any) {
    if (!['payment.captured', 'order.paid'].includes(body?.event))
      return { ok: true };
    const p = body?.payload?.payment?.entity;
    if (!p?.order_id || !p?.id) return { ok: true };
    const payment = await this.model.findOne({ gatewayOrderId: p.order_id });
    if (!payment) {
      this._logger.warn(`Razorpay webhook for unknown order ${p.order_id}`);
      return { ok: true };
    }
    await this.complete(payment, p.id);
    return { ok: true };
  }

  // Latest paid Razorpay payment for a PR (used after a page reload)
  async getStatus(articleId: string, me: IMe): Promise<PaymentResult> {
    const paid = await this.model.findOne(
      { articleId, userId: me.userId, status: PaymentOrderStatusEnum.PAID },
      null,
      { sort: { paidAt: -1 } }
    );
    if (!paid) return { status: 'PENDING', submitted: false };
    return this.fulfil.resultFor(paid);
  }

  // Confirms the payment with Razorpay, then adds the credits once and submits
  // the PR (shared step). Safe to call from both the browser and the webhook.
  private async complete(
    payment: PaymentOrder,
    paymentId: string
  ): Promise<PaymentResult> {
    const gw = await this.client.getPayment(paymentId);
    assert(
      gw.order_id === payment.gatewayOrderId &&
        gw.amount === payment.amount &&
        gw.currency === payment.currency,
      new BadRequestException('Payment does not match this order')
    );
    assert(
      gw.status !== 'failed',
      new BadRequestException('Payment failed. Please try again.')
    );
    if (gw.status !== 'captured') {
      // Authorised but not captured yet: the webhook finishes it
      return {
        status: 'PENDING',
        submitted: false,
        message: 'Payment is being confirmed'
      };
    }

    // Money confirmed by Razorpay: add the credits once and submit the PR
    return this.fulfil.claimAndFulfil(payment, paymentId, 'Razorpay');
  }
}
