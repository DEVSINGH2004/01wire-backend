import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class KeywordJoinInput {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;
}
