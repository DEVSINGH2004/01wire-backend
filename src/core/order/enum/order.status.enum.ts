import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatusEnum {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED'
}

registerEnumType(OrderStatusEnum, { name: 'OrderStatusEnum' });
