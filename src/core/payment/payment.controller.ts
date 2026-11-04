import { Body, Controller, Headers, Post, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { IWebhookPayload } from './providers/copperx/copperx.interface';

@Controller('payment')
export class PaymentController {
  constructor(private _paymentService: PaymentService) {}

  @Post('/copperx/webhook')
  async copperxWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: IWebhookPayload,
    @Headers('X-Webhook-Token') webhookToken: string,
    @Headers('x-webhook-signature') signature: string
  ) {
    return this._paymentService.handleWebhook(body, webhookToken, signature, req.rawBody);
  }
}
