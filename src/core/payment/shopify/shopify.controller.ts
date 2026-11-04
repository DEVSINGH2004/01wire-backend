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
import { ShopifyClient } from './shopify.client';
import { ShopifyService } from './shopify.service';

// Shopify "orders/paid" webhook: POST /payment/shopify/webhook
@Controller('payment/shopify')
export class ShopifyController {
  constructor(
    private client: ShopifyClient,
    private shopifyService: ShopifyService
  ) {}

  @Post('/webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Headers('x-shopify-topic') topic: string,
    @Headers('x-shopify-shop-domain') shopDomain: string
  ) {
    if (!this.client.isWebhookValid(req.rawBody, hmac))
      throw new UnauthorizedException('Invalid signature');
    return this.shopifyService.handleWebhook(topic, shopDomain, body);
  }
}
