import { registerEnumType } from '@nestjs/graphql';

export enum BundleCategoryEnum {
  WEB3 = 'WEB3',
  YAHOO = 'YAHOO'
}

registerEnumType(BundleCategoryEnum, { name: 'BundleCategoryEnum' });
