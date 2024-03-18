import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { TransactionService } from '../transaction/services/transaction.service';
import { UserService } from '../user/services/user.service';
import { CopperxService } from './providers/copperx/copperx.service';
import { IWebhookPayload as ICopperxWebhookPayload } from './providers/copperx/copperx.interface';

@Injectable()
export class PaymentService {
  private _logger = new Logger(PaymentService.name);

  constructor(
    private _userService: UserService,
    private _copperxService: CopperxService,
    @Inject(forwardRef(() => TransactionService))
    private _transactionService: TransactionService
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
    const user = await this._userService.getUserById(userId);
    // TODO: update this when adding more payment providers
    let customerId = user.pgCustomerIds?.copperx;

    if (!customerId) {
      const customer = await this._copperxService.createCustomer({
        userId,
        email: user.email,
        username: user.email
      });
      customerId = customer.id;
      await this._userService.addPgCustomerId(userId, customerId, 'copperx');
    }
    return this._copperxService.createCheckoutSession({
      userId,
      customerId,
      // currency,
      amount,
      dbTransactionId
    });
  }

  async handleWebhook(data: ICopperxWebhookPayload, webhookToken: string) {
    const { transactionId, status } =
      await this._copperxService.parseWebhookData(data, webhookToken);

    this._logger.log('Transaction successful', {
      transactionId,
      data
    });

    // TODO: Add on transaction success in txn service
    // await this._transactionService.onTransactionSuccess(transactionId);
  }
}
