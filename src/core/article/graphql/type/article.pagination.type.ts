import { Field, ObjectType } from '@nestjs/graphql';
import { ArticleType } from './article.type';
import { PaginationType } from 'src/common/graphql/type/pagination.type';

@ObjectType('ArticlePaginationType')
export class ArticlePaginationType {
  @Field(() => [ArticleType])
  data: ArticleType[];

  @Field(() => PaginationType)
  paginationInfo: PaginationType;
}
