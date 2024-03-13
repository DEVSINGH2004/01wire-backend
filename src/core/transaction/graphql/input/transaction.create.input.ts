import { InputType, PickType } from '@nestjs/graphql';
import { TransactionType } from '../type/transaction.type';

@InputType()
export class TransactionCreateInput extends PickType(
  TransactionType,
  ['kind'] as const,
  InputType
) {}
