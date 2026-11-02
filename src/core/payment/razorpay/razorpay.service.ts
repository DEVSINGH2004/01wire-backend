import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
import * as assert from 'assert';
import { IMe } from 'src/common/graphql/interface/context.interface';
import { ArticleService } from 'src/core/article/services/article.service';
import { ArticleStatusEnum } from 'src/core/article/enum/article.status.enum';
import { WalletService } from 'src/core/wallet/services/wallet.service';
import { PublicationService } from 'src/core/publication/services/publication.service';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { EventDomainEnum } from 'src/core/events/enum/event.domain.enum';
import { EventActionEnum } from 'src/core/events/enum/event.action.enum';
import { RazorpayClient } from './razorpay.client';
import { PaymentOrder, PaymentOrderStatusEnum } from './payment.order.schema';

export type PaymentResult = {
  status: 'PAID' | 'PENDING';
  // true when the PR was submitted after the payment
  submitted: boolean;
  message?: string;
};

const inr = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

@Injectable()
export class RazorpayService {
  private _logger = new Logger(RazorpayService.name);

  constructor(
    @InjectModel(PaymentOrder.name) private model: Model<PaymentOrder>,
    private client: RazorpayClient,
    private articleService: ArticleService,
    private walletService: WalletService,
    private publicationService: PublicationService,
    private eventEmitter: EventEmitter2
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
    return {
      status: 'PAID',
      submitted: !paid.submitError,
      message: paid.submitError
    };
  }

  // Confirms the payment with Razorpay, adds the credits once, then submits
  // the PR. Safe to call from both the browser and the webhook.
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

    // Atomic claim: only one caller (browser or webhook) adds the credits
    const claimed = await this.model.findOneAndUpdate(
      { _id: payment._id, status: PaymentOrderStatusEnum.PENDING },
      {
        $set: {
          status: PaymentOrderStatusEnum.PAID,
          gatewayPaymentId: paymentId,
          paidAt: new Date()
        }
      },
      { new: true }
    );
    if (!claimed) {
      const now = await this.model.findOne({ _id: payment._id });
      return {
        status: 'PAID',
        submitted: !now?.submitError,
        message: now?.submitError
      };
    }

    try {
      await this.walletService.creditBalanceByUserId({
        userId: claimed.userId,
        amount: claimed.credits,
        notes: `Razorpay payment ${paymentId} (${inr(claimed.amount)}) for PR #${claimed.prId}`
      });
    } catch (e) {
      // Undo the claim so a webhook retry can add the credits later
      await this.model.updateOne(
        { _id: claimed._id },
        {
          $set: {
            status: PaymentOrderStatusEnum.PENDING,
            gatewayPaymentId: null,
            paidAt: null
          }
        }
      );
      throw e;
    }

    this.eventEmitter.emit(EventDomainEnum.SLACK, {
      action: EventActionEnum.SEND,
      data: `💰 Razorpay ${inr(claimed.amount)} (${claimed.credits} credits) for PR #${claimed.prId} | user ${claimed.userId}`
    });

    // Submit the PR: debits the same credits and creates the orders
    try {
      await this.articleService.updateStatus(
        { id: claimed.articleId, status: ArticleStatusEnum.SUBMITTED } as any,
        { userId: claimed.userId, userType: UserTypeEnum.USER } as IMe
      );
      return { status: 'PAID', submitted: true };
    } catch (e) {
      const message = `Payment received and ${claimed.credits} credits were added to your wallet, but the PR could not be submitted: ${e.message}`;
      await this.model.updateOne(
        { _id: claimed._id },
        { $set: { submitError: message } }
      );
      this._logger.warn(`PR submit after Razorpay payment failed: ${e.message}`);
      return { status: 'PAID', submitted: false, message };
    }
  }
}
