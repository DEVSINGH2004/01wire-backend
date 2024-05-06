import { Field, ObjectType } from '@nestjs/graphql';
import { PaginationType } from 'src/common/graphql/type/pagination.type';
import { UserType } from './user.type';

@ObjectType('UserPaginationType')
export class UserPaginationType {
  @Field(() => [UserType])
  data: UserType[];

  @Field(() => PaginationType)
  paginationInfo: PaginationType;
}
