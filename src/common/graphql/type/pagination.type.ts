import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('PaginationType')
export class PaginationType {
  @Field(() => Int)
  readonly currentPage: number;

  @Field(() => Int)
  readonly perPage: number;

  @Field(() => Int, { nullable: true })
  readonly pageCount: number;

  @Field(() => Int, { nullable: true })
  readonly itemCount: number;

  @Field(() => Boolean, { nullable: true })
  readonly hasNextPage: boolean;

  @Field(() => Boolean, { nullable: true })
  readonly hasPreviousPage: boolean;
}
