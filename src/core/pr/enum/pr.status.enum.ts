import { registerEnumType } from '@nestjs/graphql';

export enum PrStatusEnum {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED'
}

registerEnumType(PrStatusEnum, { name: 'PrStatusEnum' });
