import {
  Field,
  ID,
  InputType,
  Int,
  PartialType,
  PickType
} from '@nestjs/graphql';
import { ArticleType } from '../type/article.type';
import { ArticleCategoryEnum } from '../../enum/article.category.enum';
import { ArticleStatusEnum } from '../../enum/article.status.enum';

@InputType()
export class ArticleFilterInput extends PartialType(
  PickType(ArticleType, ['clientId'] as const),
  InputType
) {
  @Field(() => [ArticleCategoryEnum], { nullable: true })
  categories: ArticleCategoryEnum[];

  @Field(() => Date, { nullable: true })
  startTime: Date;

  @Field(() => Date, { nullable: true })
  endTime: Date;

  @Field(() => Int, { nullable: true })
  prId: number;

  @Field(() => [ArticleStatusEnum], { nullable: true })
  status: ArticleStatusEnum[];

  @Field(() => ID, { nullable: true })
  userId: string;
}
