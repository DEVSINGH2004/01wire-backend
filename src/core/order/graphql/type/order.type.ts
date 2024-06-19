import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { OrderStatusEnum } from '../../enum/order.status.enum';

@ObjectType('OrderType')
export class OrderType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  articleId: string;

  @Field(() => Int)
  prId: number;

  @Field(() => ID)
  publicationId: string;

  @Field(() => ID, { nullable: true })
  bundleId: string;

  @Field(() => OrderStatusEnum)
  status: OrderStatusEnum;

  @Field(() => String, { nullable: true })
  notes: string;

  @Field(() => Date, { nullable: true })
  publishAt: Date;

  @Field(() => Date, { nullable: true })
  publishBy: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
