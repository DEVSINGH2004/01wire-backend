import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('PublicationStatsType')
export class PublicationStatsType {
  @Field(() => Int, { nullable: true })
  da?: number;

  @Field(() => Int, { nullable: true })
  pa?: number;

  @Field(() => Int, { nullable: true })
  dr?: number;

  @Field(() => Int, { nullable: true })
  ur?: number;

  @Field(() => Int, { nullable: true })
  traffic?: number;
}
