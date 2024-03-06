import { registerEnumType } from '@nestjs/graphql';

export enum CouponStatusEnum {
  INACTIVE = 'INACTIVE',
  ACTIVE = 'ACTIVE',
  CONSUMED = 'CONSUMED'
}

registerEnumType(CouponStatusEnum, { name: 'CouponStatusEnum' });
