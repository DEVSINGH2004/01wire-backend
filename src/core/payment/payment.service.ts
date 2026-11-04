import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { TransactionService } from '../transaction/services/transaction.service';
import { UserService } from '../user/services/user.service';
import { CopperxService } from './providers/copperx/copperx.service';
import { IWebhookPayload as ICopperxWebhookPayload } from './providers/copperx/copperx.interface';

@Injectable()
export class PaymentService {
  private _logger = new Logger(PaymentService.name);

  constructor(
    private userService: UserService,
    private copperxService: CopperxService,
    @Inject(forwardRef(() => TransactionService))
    private transactionService: TransactionService
  ) {}

  async createCheckoutSession({
    userId,
    amount,
    // currency,
    dbTransactionId
  }: {
    userId: string;
    amount: number;
    // currency: string;
    dbTransactionId: string;
  }) {
    const user = await this.userService.getUserById(userId);
    // TODO: update this when adding more payment providers
    let customerId = user.pgCustomerIds?.copperx;

    if (!customerId) {
      const customer = await this.copperxService.createCustomer({
        userId,
        email: user.email,
        username: user.email
      });
      customerId = customer.id;
      await this.userService.addPgCustomerId(userId, customerId, 'copperx');
    }
    return this.copperxService.createCheckoutSession({
      userId,
      customerId,
      currency: 'usdt',
      amount,
      dbTransactionId
    });
  }

  // CopperX webhook: token/signature checked, then the session is read back from
  // CopperX itself - only a session CopperX reports as paid, for this transaction,
  // can add credits (amount checked in onTransactionSuccess).
  async handleWebhook(
    data: ICopperxWebhookPayload,
    webhookToken: string,
    signature?: string,
    rawBody?: Buffer
  ) {
    const { transactionId, sessionId } =
      await this.copperxService.parseWebhookData(data, webhookToken, signature, rawBody);
    if (!transactionId || !sessionId) return { ok: true };

    const session = await this.copperxService.getCheckoutSession(sessionId);
    if (session?.paymentStatus !== 'paid' || session?.clientReferenceId !== transactionId) {
      this._logger.warn('CopperX session not paid (or not this transaction); no credits', {
        transactionId,
        sessionId,
        paymentStatus: session?.paymentStatus
      });
      return { ok: true };
    }
    this._logger.log('CopperX payment confirmed', { transactionId, sessionId });
    await this.transactionService.onTransactionSuccess(transactionId, {
      amountTotal: session.amountTotal,
      currency: session.currency
    });
    return { ok: true };
  }
}
