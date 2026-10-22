import { Field, ID, InputType } from '@nestjs/graphql';

// Matches EstimateCreateDto: title is required; the id lists may be omitted
// (default []), but at least one publication or bundle must be given.
@InputType()
export class EstimateCreateInput {
  @Field(() => String)
  title: string;

  @Field(() => [ID], { nullable: true })
  publicationIds?: string[];

  @Field(() => [ID], { nullable: true })
  bundleIds?: string[];
}
