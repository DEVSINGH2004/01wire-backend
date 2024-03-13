import { Field, InputType, PartialType, PickType } from '@nestjs/graphql';
import { ArticleType } from '../type/article.type';
import { ArticleCategoryEnum } from '../../enum/article.category.enum';

@InputType()
export class ArticleFilterInput extends PartialType(
  PickType(ArticleType, ['clientId', 'status'] as const),
  InputType
) {
  @Field(() => [ArticleCategoryEnum], { nullable: true })
  categories: ArticleCategoryEnum[];

  @Field(() => Date, { nullable: true })
  startTime: Date;

  @Field(() => Date, { nullable: true })
  endTime: Date;
}
