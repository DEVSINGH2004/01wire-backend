import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class ArticleUpdateInput {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  title?: string;
}
