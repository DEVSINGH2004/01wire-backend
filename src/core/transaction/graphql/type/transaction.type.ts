import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
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

  @Field(() => Int)
  amount: number;

  @Field(() => String, { nullable: true })
  notes?: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Admin who made the change (ADMIN_UPDATE only); admins only'
  })
  performedBy?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
