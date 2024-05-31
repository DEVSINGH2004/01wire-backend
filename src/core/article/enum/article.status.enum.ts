import { registerEnumType } from '@nestjs/graphql';

export enum ArticleStatusEnum {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  REVIEW = 'REVIEW',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  SCHEDULED = 'SCHEDULED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED'
}

registerEnumType(ArticleStatusEnum, { name: 'ArticleStatusEnum' });
