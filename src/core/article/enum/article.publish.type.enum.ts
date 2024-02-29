import { registerEnumType } from '@nestjs/graphql';

export enum ArticlePublishTypeEnum {
  IMMEDIATE = 'IMMEDIATE',
  SCHEDULED = 'SCHEDULED'
}

registerEnumType(ArticlePublishTypeEnum, { name: 'ArticlePublishTypeEnum' });
