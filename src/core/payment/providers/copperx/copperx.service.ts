import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';

import { AxiosInstance, AxiosResponse } from 'axios';
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
    dbTransactionId
  }: {
    userId: string;
    customerId: string;
    amount: number;
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
              currency: 'matic',
              // TODO: Fix this unit amount
              unitAmount: amount.toString(),

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

  async parseWebhookData(data: IWebhookPayload, webhookToken: string) {
    const webhookSecretKey = this.configService.get(
      'copperx.webhookSecretKey',
      {
        infer: true
      }
    );

    if (webhookSecretKey !== webhookToken) {
      this._logger.error('Invalid webhook token', {
        incomingToken: webhookToken,
        data
      });
      throw new ForbiddenException();
    }

    if (data.type === 'checkout_session.completed') {
      return {
        status: 'CAPTURED' as const,
        transactionId: data.data.object.clientReferenceId
      };
    }
    this._logger.error('Invalid webhook data', data);
    throw new InternalServerErrorException('Invalid webhook data');
  }
}
