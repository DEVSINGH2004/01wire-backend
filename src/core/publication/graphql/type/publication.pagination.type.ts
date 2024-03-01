import { Field, ObjectType } from '@nestjs/graphql';
import { PaginationType } from 'src/common/graphql/type/pagination.type';
import { PublicationType } from './publication.type';

@ObjectType('PublicationPaginationType')
export class PublicationPaginationType {
  @Field(() => [PublicationType])
  data: PublicationType[];

  @Field(() => PaginationType)
  paginationInfo: PaginationType;
}
