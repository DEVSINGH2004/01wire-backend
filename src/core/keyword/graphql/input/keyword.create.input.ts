import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class KeywordCreateInput {
  @Field(() => String)
  title: string;

  @Field(() => [String])
  keywords: string[];
}
