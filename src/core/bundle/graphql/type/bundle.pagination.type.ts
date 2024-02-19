import { Field, ObjectType } from '@nestjs/graphql';
import { PaginationType } from 'src/common/graphql/type/pagination.type';
import { BundleType } from './bundle.type';

@ObjectType('BundlePaginationType')
export class BundlePaginationType {
  @Field(() => [BundleType])
  data: BundleType[];

  @Field(() => PaginationType)
  paginationInfo: PaginationType;
}
