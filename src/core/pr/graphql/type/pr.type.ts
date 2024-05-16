import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { PrStatusEnum } from '../../enum/pr.status.enum';

@ObjectType('PrType')
export class PrType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  articleId: string;

  @Field(() => ID)
  publicationId: string;

  @Field(() => ID)
  bundleId: string;

  @Field(() => PrStatusEnum)
  status: PrStatusEnum;

  @Field(() => String, { nullable: true })
  rejectionReason: string;

  @Field(() => Date, { nullable: true })
  publishAt: Date;

  @Field(() => Date, { nullable: true })
  publishBy: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
