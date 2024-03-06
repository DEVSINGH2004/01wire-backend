import { registerEnumType } from '@nestjs/graphql';

export enum CouponCategoryEnum {
  PUBLICATION = 'PUBLICATION',
  BUNDLE = 'BUNDLE',
  WALLET = 'WALLET'
}

registerEnumType(CouponCategoryEnum, { name: 'CouponCategoryEnum' });
