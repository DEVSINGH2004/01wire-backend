import { Field, ObjectType } from '@nestjs/graphql';
import { PaginationType } from 'src/common/graphql/type/pagination.type';
import { ClientType } from './client.type';

@ObjectType('ClientPaginationType')
export class ClientPaginationType {
  @Field(() => [ClientType])
  data: ClientType[];

  @Field(() => PaginationType)
  paginationInfo: PaginationType;
}
