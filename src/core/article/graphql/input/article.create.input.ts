import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ArticleCreateInput {
  @Field(() => String)
  title: string;
}
