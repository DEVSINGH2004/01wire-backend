import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('BundleType')
export class BundleType {
  @Field(() => ID)
  id: string;

  @Field(() => [ID])
  productIds: string[];

  @Field(() => Int)
  price: number;

  @Field(() => String)
  notes: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
