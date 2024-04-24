import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ArticleStatusEnum } from '../../enum/article.status.enum';

@ObjectType('ArticleStatsType')
export class ArticleStatsType {
  @Field(() => ArticleStatusEnum)
  status: ArticleStatusEnum;

  @Field(() => Int)
  count: number;
}
