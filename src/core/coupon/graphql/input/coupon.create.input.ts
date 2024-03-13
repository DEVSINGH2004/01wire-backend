import { InputType, OmitType } from '@nestjs/graphql';
import { CouponType } from '../type/coupon.type';

@InputType()
export class CouponCreateInput extends OmitType(
  CouponType,
  ['id', 'status', 'code', 'used', 'createdAt', 'updatedAt'] as const,
  InputType
) {}
