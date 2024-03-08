import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { BundleCreateInput } from './bundle.create.input';

@InputType()
export class BundleUpdateInput extends PartialType(BundleCreateInput) {
  @Field(() => ID)
  id: string;
}
