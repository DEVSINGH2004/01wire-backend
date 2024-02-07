import { Field, ID, InputType } from '@nestjs/graphql';
import { KeywordCreateInput } from './keyword.create.input';

@InputType()
export class KeywordUpdateInput extends KeywordCreateInput {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => [String])
  keywords: string[];
}
