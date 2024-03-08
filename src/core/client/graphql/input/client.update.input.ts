import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { ClientCreateInput } from './client.create.input';

@InputType()
export class ClientUpdateInput extends PartialType(
  ClientCreateInput,
  InputType
) {
  @Field(() => ID)
  id: string;
}
