import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArticleModule } from 'src/core/article/article.module';
import { WalletModule } from 'src/core/wallet/wallet.module';
import { PublicationModule } from 'src/core/publication/publication.module';
import { PaymentOrder, PaymentOrderSchema } from './payment.order.schema';
import { RazorpayClient } from './razorpay.client';
import { RazorpayService } from './razorpay.service';
import { RazorpayResolver } from './graphql/razorpay.resolver';
import { RazorpayController } from './razorpay.controller';
import { PaymentFulfilService } from './payment.fulfil.service';
import { ShopifyClient } from '../shopify/shopify.client';
import { ShopifyService } from '../shopify/shopify.service';
import { ShopifyResolver } from '../shopify/shopify.resolver';

// Pay for a PR through a gateway (one shared credits + submit step):
// - Razorpay: order -> checkout popup -> verify/webhook -> credits -> submit
// - Shopify: draft order -> Shopify checkout -> status check -> credits -> submit
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentOrder.name, schema: PaymentOrderSchema }
    ]),
    ArticleModule,
    WalletModule,
    PublicationModule
  ],
  providers: [
    PaymentFulfilService,
    RazorpayClient,
    RazorpayService,
    RazorpayResolver,
    ShopifyClient,
    ShopifyService,
    ShopifyResolver
  ],
  controllers: [RazorpayController]
})
export class RazorpayModule {}
