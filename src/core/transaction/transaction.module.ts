import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionResolver } from './graphql/transaction.resolver';
import { Transaction, TransactionSchema } from './transaction.schema';
import { TransactionService } from './services/transaction.service';
import { CouponModule } from '../coupon/coupon.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentModule } from '../payment/payment.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema }
    ]),
    CouponModule,
    WalletModule,
    PaymentModule,
    UserModule
  ],
  providers: [TransactionService, TransactionResolver],
  exports: [TransactionService]
})
export class TransactionModule {}
