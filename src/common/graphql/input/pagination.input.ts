import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class PaginationInput {
  @Field(() => Int)
  readonly currentPage: number;

  @Field(() => Int)
  readonly perPage: number;
}
