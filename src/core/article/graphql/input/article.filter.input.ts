import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class ArticleFilterInput {
  @Field(() => Date, { nullable: true })
  startTime?: Date;

  @Field(() => Date, { nullable: true })
  endTime?: Date;
}
