import { Body, Controller, Headers, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { IWebhookPayload } from './providers/copperx/copperx.interface';

@Controller('payment')
export class PaymentController {
  constructor(private _paymentService: PaymentService) {}

  @Post('/copperx/webhook')
  async copperxWebhook(
    @Body() body: IWebhookPayload,
    @Headers('X-Webhook-Token') webhookToken: string
  ) {
    return this._paymentService.handleWebhook(body, webhookToken);
  }
}
