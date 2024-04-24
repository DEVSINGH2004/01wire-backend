import { registerEnumType } from '@nestjs/graphql';

export enum ArticleStatusEnum {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  SCHEDULED = 'SCHEDULED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED'
}

registerEnumType(ArticleStatusEnum, { name: 'ArticleStatusEnum' });
