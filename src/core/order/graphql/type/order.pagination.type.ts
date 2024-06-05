import { Field, ObjectType } from '@nestjs/graphql';
import { OrderType } from './order.type';
import { PaginationType } from 'src/common/graphql/type/pagination.type';

@ObjectType('OrderPaginationType')
export class OrderPaginationType {
  @Field(() => [OrderType])
  data: OrderType[];

  @Field(() => PaginationType)
  paginationInfo: PaginationType;
}
