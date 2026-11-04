import { Module } from '@nestjs/common';
import { UserModule } from 'src/core/user/user.module';
import { PaymentAccessService } from './payment.access.service';

// Who may pay with real-money gateways (see PaymentAccessService)
@Module({
  imports: [UserModule],
  providers: [PaymentAccessService],
  exports: [PaymentAccessService]
})
export class PaymentAccessModule {}
