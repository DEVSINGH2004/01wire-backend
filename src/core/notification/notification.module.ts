import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from '../article/article.schema';
import { Publication, PublicationSchema } from '../publication/publication.schema';
import { Bundle, BundleSchema } from '../bundle/bundle.schema';
import { User, UserSchema } from '../user/user.schema';
import { Wallet, WalletSchema } from '../wallet/wallet.schema';
import { PaymentOrder, PaymentOrderSchema } from '../payment/razorpay/payment.order.schema';
import { Order, OrderSchema } from '../order/order.schema';
import { EmailService } from '../services/email.service';
import { Cart, CartSchema, EmailLog, EmailLogSchema } from './notification.schema';
import { NotificationService } from './notification.service';
import { NotificationResolver } from './notification.resolver';
import { NotificationController } from './notification.controller';

// Receipts (every purchase) and reminder emails (abandoned cart, unpaid draft PR)
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: EmailLog.name, schema: EmailLogSchema },
      { name: Article.name, schema: ArticleSchema },
      { name: Publication.name, schema: PublicationSchema },
      { name: Bundle.name, schema: BundleSchema },
      { name: User.name, schema: UserSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: PaymentOrder.name, schema: PaymentOrderSchema },
      { name: Order.name, schema: OrderSchema }
    ])
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationResolver, EmailService]
})
export class NotificationModule {}
