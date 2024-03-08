import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { PublicationCreateInput } from './publication.create.input';

@InputType()
export class PublicationUpdateInput extends PartialType(
  PublicationCreateInput
) {
  @Field(() => ID)
  id: string;
}
