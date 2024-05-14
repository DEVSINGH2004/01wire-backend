import { Field, ObjectType } from '@nestjs/graphql';
import { PrType } from './pr.type';
import { PaginationType } from 'src/common/graphql/type/pagination.type';

@ObjectType('PrPaginationType')
export class PrPaginationType {
  @Field(() => [PrType])
  data: PrType[];

  @Field(() => PaginationType)
  paginationInfo: PaginationType;
}
