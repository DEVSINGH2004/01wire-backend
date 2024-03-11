import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { ArticleCreateInput } from './article.create.input';

@InputType()
export class ArticleUpdateInput extends PartialType(
  ArticleCreateInput,
  InputType
) {
  @Field(() => ID)
  id: string;
}
