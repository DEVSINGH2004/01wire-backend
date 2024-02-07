import { Field, ObjectType } from '@nestjs/graphql';
import { PaginationType } from 'src/common/graphql/type/pagination.type';
import { KeywordType } from './keyword.type';

@ObjectType('KeywordPaginationType')
export class KeywordPaginationType {
  @Field(() => [KeywordType])
  data: KeywordType[];

  @Field(() => PaginationType)
  paginationInfo: PaginationType;
}
