import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException
} from '@nestjs/common';
import { Request } from 'express';
import { RazorpayClient } from './razorpay.client';
import { RazorpayService } from './razorpay.service';

@Controller('payment/razorpay')
export class RazorpayController {
  constructor(
    private client: RazorpayClient,
    private razorpayService: RazorpayService
  ) {}

  @Post('/webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
    @Headers('x-razorpay-signature') signature: string
  ) {
    if (!this.client.isWebhookSignatureValid(req.rawBody, signature))
      throw new UnauthorizedException('Invalid signature');
    return this.razorpayService.handleWebhook(body);
  }
}
