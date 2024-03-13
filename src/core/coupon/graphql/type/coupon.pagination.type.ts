import { Field, ObjectType } from '@nestjs/graphql';
import { PaginationType } from 'src/common/graphql/type/pagination.type';
import { CouponType } from './coupon.type';

@ObjectType('CouponPaginationType')
export class CouponPaginationType {
  @Field(() => [CouponType])
  data: CouponType[];

  @Field(() => PaginationType)
  paginationInfo: PaginationType;
}
