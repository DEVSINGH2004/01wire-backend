import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { CouponTypeEnum } from '../../enum/coupon.type.enum';
import { CouponCategoryEnum } from '../../enum/coupon.category.enum';
import { CouponStatusEnum } from '../../enum/coupon.status.enum';

@ObjectType('CouponType')
export class CouponType {
  @Field(() => ID)
  id: string;

  @Field(() => ID, { nullable: true })
  userId: string;

  @Field(() => CouponTypeEnum)
  type: CouponTypeEnum;

  @Field(() => CouponCategoryEnum)
  category: CouponCategoryEnum;

  @Field(() => CouponStatusEnum)
  status: CouponStatusEnum;

  @Field(() => String)
  code: string;

  @Field(() => Int)
  value: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  used: number;

  @Field(() => Date)
  expireAt: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
