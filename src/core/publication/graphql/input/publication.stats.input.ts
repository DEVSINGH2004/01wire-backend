import { Field, InputType, Int } from '@nestjs/graphql';

@InputType('PublicationStatsInput')
export class PublicationStatsInput {
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
