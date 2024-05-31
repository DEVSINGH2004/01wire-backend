import { registerEnumType } from '@nestjs/graphql';

export enum BundleTypeEnum {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  DIAMOND = 'DIAMOND'
}

registerEnumType(BundleTypeEnum, { name: 'BundleTypeEnum' });
