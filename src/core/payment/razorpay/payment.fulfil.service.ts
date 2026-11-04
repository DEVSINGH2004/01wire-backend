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
@Injectable()
export class PaymentFulfilService {
  private _logger = new Logger(PaymentFulfilService.name);

  constructor(
    @InjectModel(PaymentOrder.name) private model: Model<PaymentOrder>,
    private articleService: ArticleService,
    private walletService: WalletService,
    private eventEmitter: EventEmitter2
  ) {}

  // Result for a payment already marked PAID (no gateway call needed)
  resultFor(payment: PaymentOrder): PaymentResult {
    return {
      status: 'PAID',
      submitted: !payment?.submitError,
      message: payment?.submitError
    };
  }

  async claimAndFulfil(
    payment: PaymentOrder,
    gatewayPaymentId: string,
    gateway: string
  ): Promise<PaymentResult> {
    // Atomic claim: only one caller adds the credits
    const claimed = await this.model.findOneAndUpdate(
      { _id: payment._id, status: PaymentOrderStatusEnum.PENDING },
      {
        $set: {
          status: PaymentOrderStatusEnum.PAID,
          gatewayPaymentId,
          paidAt: new Date()
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
        notes: `${gateway} payment ${gatewayPaymentId} (${inr(claimed.amount)}) for PR #${claimed.prId}`
      });
    } catch (e) {
      // Undo the claim so a later retry can add the credits
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
      data: `💰 ${gateway} ${inr(claimed.amount)} (${claimed.credits} credits) for PR #${claimed.prId} | user ${claimed.userId}`
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
      this._logger.warn(`PR submit after ${gateway} payment failed: ${e.message}`);
      return { status: 'PAID', submitted: false, message };
    }
  }
}
