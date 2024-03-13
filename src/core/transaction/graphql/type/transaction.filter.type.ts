import { Field, ObjectType } from '@nestjs/graphql';
import { PaginationType } from 'src/common/graphql/type/pagination.type';
import { TransactionType } from './transaction.type';

@ObjectType('TransactionFilter')
export class TransactionFilterType {
  @Field(() => PaginationType, { nullable: true })
  paginationInfo?: PaginationType;

  @Field(() => [TransactionType], { nullable: true })
  data: TransactionType[];
}
