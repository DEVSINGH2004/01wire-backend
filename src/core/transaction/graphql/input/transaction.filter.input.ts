import { Field, InputType, PartialType, PickType } from '@nestjs/graphql';
import { TransactionType } from '../type/transaction.type';

@InputType()
export class TransactionFilterInput extends PartialType(
  PickType(TransactionType, ['type', 'kind'] as const),
  InputType
) {
  @Field(() => Date, { nullable: true })
  startTime: Date;

  @Field(() => Date, { nullable: true })
  endTime: Date;
}
