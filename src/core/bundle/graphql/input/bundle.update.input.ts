import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class BundleUpdateInput {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  title?: string;
}
