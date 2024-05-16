import { registerEnumType } from '@nestjs/graphql';

export enum TransactionStatusEnum {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

registerEnumType(TransactionStatusEnum, { name: 'TransactionStatusEnum' });
