import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';

import { AxiosInstance, AxiosResponse } from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  ICheckoutCreateRequest,
  ICheckoutCreateResponse,
  ICustomerCreateRequest,
  ICustomerCreateResponse,
  IWebhookPayload
} from './copperx.interface';
import { ConfigService } from '@nestjs/config';
import { ConfigVariablesType } from 'src/config';
import { COPPERX_HTTP_CLIENT } from './constants';

// CopperX amounts: whole integer with 8 decimals (1 USDT = "100000000")
export const toCopperxUnits = (amount: number) =>
  (BigInt(Math.round(amount * 100)) * BigInt(1000000)).toString();

@Injectable()
export class CopperxService {
  private _logger = new Logger(CopperxService.name);

  constructor(
    @Inject(COPPERX_HTTP_CLIENT)
    private client: AxiosInstance,
    private configService: ConfigService<ConfigVariablesType>
  ) {}

  async createCheckoutSession({
    customerId,
    amount,
    currency,
    dbTransactionId
  }: {
    userId: string;
    customerId: string;
    amount: number;
    currency: string;
    dbTransactionId: string;
  }): Promise<{
    url: string;
  }> {
    const { successUrl, cancelUrl } = this.configService.get('copperx', {
      infer: true
    });
    const { data } = await this.client.post<
      ICheckoutCreateResponse,
      AxiosResponse<ICheckoutCreateResponse>,
      ICheckoutCreateRequest
    >('/checkout/sessions', {
      customerId,
      clientReferenceId: dbTransactionId,
      successUrl,
      cancelUrl,
      lineItems: {
        data: [
          {
            priceData: {
              // NOTE: this is hardcoded for now
              currency,
              // Already in CopperX units (8 decimals: 1 USDT = 100000000) - scaled in
              // TransactionService.create
              unitAmount: String(Math.round(amount)),

              // TODO: Fill this product data
              productData: {
                name: 'basic',
                description: 'basic'
              }
            }
          }
        ]
      }
    });
    return data;
  }

  async createCustomer(ob: {
    userId: string;
    email: string;
    username: string;
  }) {
    const { data } = await this.client.post<
      ICustomerCreateResponse,
      AxiosResponse<ICustomerCreateResponse>,
      ICustomerCreateRequest
    >('/customers', {
      email: ob.email,
      name: ob.username,
      customerReferenceId: ob.userId
    });
    return data;
  }

  // The session as CopperX has it now (status, paymentStatus, amountTotal, currency...)
  async getCheckoutSession(id: string): Promise<{
    id: string;
    status: string;
    paymentStatus: string;
    amountTotal: string;
    currency: string;
    clientReferenceId: string | null;
  }> {
    const { data } = await this.client.get(`/checkout/sessions/${encodeURIComponent(id)}`);
    return data;
  }

  // Checks the webhook token (and the body signature when CopperX sends one);
  // returns which session the event is about. The payment itself is confirmed by the caller.
  async parseWebhookData(
    data: IWebhookPayload,
    webhookToken: string,
    signature?: string,
    rawBody?: Buffer
  ) {
    const webhookSecretKey = this.configService.get(
      'copperx.webhookSecretKey',
      {
        infer: true
      }
    );
    const same = (a: string, b: string) => {
      const x = Buffer.from(a || '');
      const y = Buffer.from(b || '');
      return x.length > 0 && x.length === y.length && timingSafeEqual(x, y);
    };

    if (!same(webhookSecretKey, webhookToken)) {
      this._logger.error('Invalid CopperX webhook token');
      throw new ForbiddenException();
    }
    if (signature && rawBody) {
      const expected = createHmac('sha256', webhookSecretKey).update(rawBody).digest('hex');
      if (!same(expected, signature.replace(/^sha256=/, ''))) {
        this._logger.error('Invalid CopperX webhook signature');
        throw new ForbiddenException();
      }
    }

    if (data?.type === 'checkout_session.completed') {
      return {
        status: 'CAPTURED' as const,
        sessionId: data.data?.object?.id,
        transactionId: data.data?.object?.clientReferenceId
      };
    }
    this._logger.error('Invalid webhook data', data);
    throw new InternalServerErrorException('Invalid webhook data');
  }
}
