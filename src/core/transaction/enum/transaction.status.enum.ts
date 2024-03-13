import { registerEnumType } from '@nestjs/graphql';

export enum TransactionStatusEnum {
  PENDING = 'PENDING',
  INITIATED = 'INITIATED',
  PROCESSING = 'PROCESSING',
  SUCCESSFUL = 'SUCCESSFUL',
  ERRORED = 'ERRORED',
  EXPIRED = 'EXPIRED',
}

registerEnumType(TransactionStatusEnum, { name: 'TransactionStatusEnum' });
