import { Module } from '@nestjs/common';
import { CouponService } from './services/coupon.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, CouponSchema } from './coupon.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }])
  ],
  providers: [CouponService]
})
export class CouponModule {}
