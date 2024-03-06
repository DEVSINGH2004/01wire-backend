import { registerEnumType } from '@nestjs/graphql';

export enum CouponTypeEnum {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED'
}

registerEnumType(CouponTypeEnum, { name: 'CouponTypeEnum' });
