import { registerEnumType } from '@nestjs/graphql';

export enum TransactionKindEnum {
  WALLET = 'WALLET',
  CREDITS_100 = 'CREDITS_100',
  CREDITS_500 = 'CREDITS_500',
  CREDITS_1000 = 'CREDITS_1000',
  CREDITS_5000 = 'CREDITS_5000'
}

registerEnumType(TransactionKindEnum, { name: 'TransactionKindEnum' });
