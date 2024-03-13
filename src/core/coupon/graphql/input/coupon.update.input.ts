import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { CouponCreateInput } from './coupon.create.input';

@InputType()
export class CouponUpdateInput extends PartialType(CouponCreateInput) {
  @Field(() => ID)
  id: string;
}
