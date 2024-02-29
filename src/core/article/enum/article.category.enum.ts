import { registerEnumType } from '@nestjs/graphql';

export enum ArticleCategoryEnum {
  PARTNERSHIP = 'PARTNERSHIP',
  FUND_RAISING = 'FUND_RAISING'
}

registerEnumType(ArticleCategoryEnum, { name: 'ArticleCategoryEnum' });
