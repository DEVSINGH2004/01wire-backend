import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('EstimateType')
export class EstimateType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => [ID], { nullable: true })
  publicationIds: string[];

  @Field(() => [ID], { nullable: true })
  bundleIds: string[];

  @Field(() => Int, { nullable: true })
  totalCredits: Number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
