import { Field, InputType, PartialType, PickType } from '@nestjs/graphql';
import { ArticleType } from '../type/article.type';

@InputType()
export class ArticleFilterInput extends PartialType(
  PickType(ArticleType, ['clientId', 'status', 'category'] as const),
  InputType
) {
  @Field(() => Date, { nullable: true })
  startTime?: Date;

  @Field(() => Date, { nullable: true })
  endTime?: Date;
}
