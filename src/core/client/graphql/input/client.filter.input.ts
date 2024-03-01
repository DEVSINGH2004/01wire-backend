import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ClientFilterInput {
  @Field(() => Date, { nullable: true })
  startTime?: Date;

  @Field(() => Date, { nullable: true })
  endTime?: Date;
}
