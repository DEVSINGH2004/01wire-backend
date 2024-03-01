import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ClientCreateInput {
  @Field(() => String)
  title: string;
}
