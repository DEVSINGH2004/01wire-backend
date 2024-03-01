import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class PublicationCreateInput {
  @Field(() => String)
  title: string;
}
