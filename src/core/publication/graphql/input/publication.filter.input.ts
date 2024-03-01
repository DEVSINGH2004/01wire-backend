import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class PublicationFilterInput {
  @Field(() => [ID], { nullable: true })
  filterIds?: string[];
}
