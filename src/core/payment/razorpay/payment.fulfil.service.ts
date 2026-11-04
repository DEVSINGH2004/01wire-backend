import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
import { IMe } from 'src/common/graphql/interface/context.interface';
import { ArticleService } from 'src/core/article/services/article.service';
import { ArticleStatusEnum } from 'src/core/article/enum/article.status.enum';
import { WalletService } from 'src/core/wallet/services/wallet.service';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { EventDomainEnum } from 'src/core/events/enum/event.domain.enum';
import { EventActionEnum } from 'src/core/events/enum/event.action.enum';
import { PaymentOrder, PaymentOrderStatusEnum } from './payment.order.schema';
import { PaymentAccessService, PAYMENTS_NOT_OPEN } from '../access/payment.access.service';

export type PaymentResult = {
  status: 'PAID' | 'PENDING';
  // true when the PR was submitted after the payment
  submitted: boolean;
  message?: string;
};

export const inr = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

// What every gateway (Razorpay, Shopify) does once the gateway itself has confirmed
// the money: claim the payment once, add the credits, then submit the PR.
// Safe to call several times (browser, polling, webhook): only the first call adds credits.
// Also: refunds (take credits back) and "needs review" flags with a Slack alert.
@Injectable()
export class PaymentFulfilService {
  private _logger = new Logger(PaymentFulfilService.name);

  constructor(
    @InjectModel(PaymentOrder.name) private model: Model<PaymentOrder>,
    private articleService: ArticleService,
    private walletService: WalletService,
    private eventEmitter: EventEmitter2,
    private access: PaymentAccessService
  ) {}

  // Result for a payment already marked PAID (no gateway call needed). While another
  // caller (e.g. the webhook) is still submitting the PR, say so instead of "submitted".
  async resultFor(payment: PaymentOrder): Promise<PaymentResult> {
    if (payment?.submitError) return { status: 'PAID', submitted: false, message: payment.submitError };
    if (!payment?.submittedAt) {
      const st = await this.articleService.freshStatus(payment.articleId).catch(() => null);
      if (!st || st === ArticleStatusEnum.DRAFT)
        return { status: 'PENDING', submitted: false, message: 'Payment received. Finishing up…' };
    }
    return { status: 'PAID', submitted: true };
  }

  private slack(text: string) {
    this.eventEmitter.emit(EventDomainEnum.SLACK, { action: EventActionEnum.SEND, data: text });
  }

  // Marks a payment for a person to check (admin list + Slack). Keeps the first reason
  // if one is already open, so repeated webhooks don't spam.
  async flag(payment: Pick<PaymentOrder, '_id' | 'prId' | 'provider' | 'amount' | 'userId'>, reason: string) {
    const res = await this.model.updateOne(
      { _id: payment._id, issue: null },
      { $set: { issue: reason, issueAt: new Date(), reviewedBy: null } }
    );
    this._logger.warn(`Payment ${payment._id} needs review: ${reason}`);
    if (res.modifiedCount)
      this.slack(
        `⚠️ Payment needs review: ${payment.provider} ${inr(payment.amount)} for PR #${payment.prId} | user ${payment.userId}\n${reason}`
      );
  }

  async claimAndFulfil(
    payment: PaymentOrder,
    gatewayPaymentId: string,
    gateway: string,
    extra: { gatewayRef?: string; test?: boolean } = {}
  ): Promise<PaymentResult> {
    // A test-mode payment (test keys, test store, test order) only counts for the test
    // accounts in PAYMENT_ALLOWED_USERS - anyone else would get a PR without paying.
    if (extra.test && !(await this.access.canPay(payment.userId, true))) {
      await this.model.updateOne(
        { _id: payment._id, status: PaymentOrderStatusEnum.PENDING },
        { $set: { status: PaymentOrderStatusEnum.CANCELLED } }
      );
      await this.flag(
        payment,
        `${gateway} TEST payment ${extra.gatewayRef || gatewayPaymentId} by an account that may not use test payments - no credits added, PR not submitted.`
      );
      return { status: 'PENDING', submitted: false, message: PAYMENTS_NOT_OPEN };
    }
    // Atomic claim: only one caller adds the credits
    const claimed = await this.model.findOneAndUpdate(
      { _id: payment._id, status: { $in: [PaymentOrderStatusEnum.PENDING, PaymentOrderStatusEnum.CANCELLED] } },
      {
        $set: {
          status: PaymentOrderStatusEnum.PAID,
          gatewayPaymentId,
          paidAt: new Date(),
          ...(extra.gatewayRef ? { gatewayRef: extra.gatewayRef } : {}),
          ...(extra.test !== undefined ? { test: !!extra.test } : {})
        }
      },
      { new: true }
    );
    if (!claimed) {
      const now = await this.model.findOne({ _id: payment._id });
      return this.resultFor(now);
    }

    try {
      await this.walletService.creditBalanceByUserId({
        userId: claimed.userId,
        amount: claimed.credits,
        notes: `${gateway} payment ${extra.gatewayRef || gatewayPaymentId} (${inr(claimed.amount)}) for PR #${claimed.prId}`
      });
    } catch (e) {
      // Undo the claim so a later retry can add the credits
      await this.model.updateOne(
        { _id: claimed._id },
        { $set: { status: payment.status, gatewayPaymentId: null, paidAt: null } }
      );
      throw e;
    }

    this.slack(
      `💰 ${gateway}${claimed.test ? ' (TEST)' : ''} ${inr(claimed.amount)} (${claimed.credits} credits) for PR #${claimed.prId} | user ${claimed.userId}`
    );

    // Submit the PR: debits the same credits and creates the orders
    try {
      await this.articleService.updateStatus(
        { id: claimed.articleId, status: ArticleStatusEnum.SUBMITTED } as any,
        { userId: claimed.userId, userType: UserTypeEnum.USER } as IMe
      );
      await this.model.updateOne({ _id: claimed._id }, { $set: { submittedAt: new Date() } });
      return { status: 'PAID', submitted: true };
    } catch (e) {
      const message = `Payment received and ${claimed.credits} credits were added to your wallet, but the PR could not be submitted: ${e.message}`;
      await this.model.updateOne({ _id: claimed._id }, { $set: { submitError: message } });
      this._logger.warn(`PR submit after ${gateway} payment failed: ${e.message}`);
      // Money came in but the PR did not go out: someone should look (e.g. paid twice)
      await this.flag(
        claimed,
        `Paid on ${gateway}${extra.gatewayRef ? ` (${extra.gatewayRef})` : ''} but the PR was not submitted: ${e.message}. The ${claimed.credits} credits are in the user's wallet - decide whether to refund.`
      );
      return { status: 'PAID', submitted: false, message };
    }
  }

  // The gateway now reports `refundedTotal` paise refunded for this payment (read from the
  // gateway itself, never from the webhook body). Handles only the newly refunded part, once:
  // a full refund takes back all credits, a partial one the same share.
  async applyRefund(payment: PaymentOrder, refundedTotal: number, gateway: string, ref: string) {
    const refunded = Math.min(Math.max(0, Math.round(refundedTotal || 0)), payment.amount);
    const before = await this.model.findOneAndUpdate(
      { _id: payment._id, status: PaymentOrderStatusEnum.PAID, refundedAmount: { $lt: refunded } },
      { $set: { refundedAmount: refunded } },
      { new: false }
    );
    if (!before) return; // nothing new (repeat delivery) or not a credited payment
    const target =
      refunded >= payment.amount ? payment.credits : Math.round((payment.credits * refunded) / payment.amount);
    await this.reverseCredits(before, Math.max(0, target - (before.reversedCredits || 0)), gateway, ref);
  }

  // Gateway refunded some money: take back the matching credits from the wallet.
  // Credits already spent on a submitted PR can't be taken back -> flagged for an admin.
  async reverseCredits(payment: PaymentOrder, credits: number, gateway: string, ref: string) {
    if (credits <= 0) return;
    const wallet = await this.walletService.getByUserId(payment.userId);
    const take = Math.min(credits, Math.max(0, wallet?.balance || 0));
    if (take > 0) {
      try {
        await this.walletService.debitBalanceByUserId({
          userId: payment.userId,
          amount: take,
          notes: `${gateway} refund ${ref} for PR #${payment.prId} (credits taken back)`
        });
      } catch (e) {
        this._logger.error(`Refund reversal failed for payment ${payment._id}: ${e.message}`);
        await this.flag(payment, `Refunded on ${gateway} (${ref}) but taking back ${credits} credits failed: ${e.message}`);
        return;
      }
      await this.model.updateOne({ _id: payment._id }, { $inc: { reversedCredits: take } });
    }
    this.slack(`↩️ ${gateway} refund ${ref} for PR #${payment.prId}: ${take} of ${credits} credits taken back | user ${payment.userId}`);
    if (take < credits)
      await this.flag(
        payment,
        `Refunded on ${gateway} (${ref}) after the credits were used: ${credits - take} of ${credits} credits could not be taken back (PR #${payment.prId} may already be in progress).`
      );
  }
}
