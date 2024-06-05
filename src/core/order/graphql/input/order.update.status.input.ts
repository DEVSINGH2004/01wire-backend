import { Field, ID, InputType } from '@nestjs/graphql';
import { OrderStatusEnum } from '../../enum/order.status.enum';

@InputType()
export class OrderUpdateStatusInput {
  @Field(() => ID)
  id: string;

  @Field(() => OrderStatusEnum)
  status: OrderStatusEnum;

  @Field(() => String, { nullable: true })
  notes: string;

  @Field(() => String, { nullable: true })
  url: string;
}
