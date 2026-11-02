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

// Pay for a PR with Razorpay: order -> checkout -> verify/webhook -> credits -> submit
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentOrder.name, schema: PaymentOrderSchema }
    ]),
    ArticleModule,
    WalletModule,
    PublicationModule
  ],
  providers: [RazorpayClient, RazorpayService, RazorpayResolver],
  controllers: [RazorpayController]
})
export class RazorpayModule {}
