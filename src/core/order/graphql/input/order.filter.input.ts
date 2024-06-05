import { Field, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { OrderType } from '../type/order.type';

@InputType()
export class OrderFilterInput extends PartialType(
  OmitType(OrderType, [
    'notes',
    'createdAt',
    'updatedAt',
    'publishAt',
    'publishBy'
  ] as const),
  InputType
) {
  @Field(() => Date, { nullable: true })
  startTime: Date;

  @Field(() => Date, { nullable: true })
  endTime: Date;
}
