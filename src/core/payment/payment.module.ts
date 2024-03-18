import { Module, forwardRef } from '@nestjs/common';
import { TransactionModule } from '../transaction/transaction.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { UserModule } from '../user/user.module';
import { CopperxModule } from './providers/copperx/copperx.module';

@Module({
  imports: [CopperxModule, forwardRef(() => TransactionModule), UserModule],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService]
})
export class PaymentModule {}
