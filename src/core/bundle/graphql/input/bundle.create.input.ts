import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class BundleCreateInput {
  @Field(() => String)
  title: string;
}
