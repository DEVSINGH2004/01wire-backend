import { Field, ID, ObjectType } from '@nestjs/graphql';
import { TransactionStatusEnum } from '../../enum/transaction.status.enum';
import { TransactionKindEnum } from '../../enum/transaction.kind.enum';
import { TransactionTypeEnum } from '../../enum/transaction.type.enum';

@ObjectType('TransactionType')
export class TransactionType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => TransactionStatusEnum)
  status: TransactionStatusEnum;

  @Field(() => TransactionTypeEnum)
  type: TransactionTypeEnum;

  @Field(() => TransactionKindEnum)
  kind: TransactionKindEnum;

  @Field(() => String)
  amount: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
