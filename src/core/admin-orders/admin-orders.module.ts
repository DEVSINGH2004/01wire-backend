import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from '../article/article.schema';
import { Order, OrderSchema } from '../order/order.schema';
import { User, UserSchema } from '../user/user.schema';
import { Client, ClientSchema } from '../client/client.schema';
import { Publication, PublicationSchema } from '../publication/publication.schema';
import { Bundle, BundleSchema } from '../bundle/bundle.schema';
import { PaymentOrder, PaymentOrderSchema } from '../payment/razorpay/payment.order.schema';
import { Transaction, TransactionSchema } from '../transaction/transaction.schema';
import { OfflineOrdersModule } from '../offline-orders/offline-orders.module';
import { AdminOrdersService } from './admin-orders.service';
import { AdminOrdersResolver } from './admin-orders.resolver';

// Read-only admin view of PRs and their orders (the "PR Orders" page)
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Article.name, schema: ArticleSchema },
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Publication.name, schema: PublicationSchema },
      { name: Bundle.name, schema: BundleSchema },
      { name: PaymentOrder.name, schema: PaymentOrderSchema },
      { name: Transaction.name, schema: TransactionSchema }
    ]),
    OfflineOrdersModule
  ],
  providers: [AdminOrdersService, AdminOrdersResolver]
})
export class AdminOrdersModule {}
