import { Field, ID, ObjectType } from '@nestjs/graphql';
import { OrderStatusEnum } from '../../enum/order.status.enum';

@ObjectType('OrderType')
export class OrderType {
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
