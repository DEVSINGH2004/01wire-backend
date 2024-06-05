import { Field, ObjectType } from '@nestjs/graphql';
import { EstimateType } from './estimate.type';
import { PaginationType } from 'src/common/graphql/type/pagination.type';

@ObjectType('EstimatePaginationType')
export class EstimatePaginationType {
  @Field(() => [EstimateType])
  data: EstimateType[];

  @Field(() => PaginationType)
  paginationInfo: PaginationType;
}
