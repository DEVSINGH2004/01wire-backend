import { Field, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { PrType } from '../type/pr.type';

@InputType()
export class PrFilterInput extends PartialType(
  OmitType(PrType, [
    'rejectionReason',
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
