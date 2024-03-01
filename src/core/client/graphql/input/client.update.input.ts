import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class ClientUpdateInput {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  title?: string;
}
