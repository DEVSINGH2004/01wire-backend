import { Field, ObjectType } from '@nestjs/graphql';
import { PaginationType } from 'src/common/graphql/type/pagination.type';
import { ProductType } from './product.type';

@ObjectType('ProductPaginationType')
export class ProductPaginationType {
  @Field(() => [ProductType])
  data: ProductType[];

  @Field(() => PaginationType)
  paginationInfo: PaginationType;
}
