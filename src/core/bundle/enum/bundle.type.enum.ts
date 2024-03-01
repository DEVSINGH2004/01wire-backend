import { registerEnumType } from '@nestjs/graphql';

export enum BundleTypeEnum {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  GOLD = 'GOLD',
  DIAMOND = 'DIAMOND'
}

registerEnumType(BundleTypeEnum, { name: 'BundleTypeEnum' });
