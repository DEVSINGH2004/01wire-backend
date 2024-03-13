import { registerEnumType } from '@nestjs/graphql';

export enum TransactionTypeEnum {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
}

registerEnumType(TransactionTypeEnum, { name: 'TransactionTypeEnum' });
