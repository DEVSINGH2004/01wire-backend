import { Module } from '@nestjs/common';
import { CouponService } from './services/coupon.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, CouponSchema } from './coupon.schema';
import { CouponResolver } from './graphql/coupon.resolver';
import { CouponLoaderService } from './services/coupon.loader.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }])
  ],
  providers: [CouponService, CouponLoaderService, CouponResolver],
  exports: [CouponService]
})
export class CouponModule {}
