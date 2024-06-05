import { Field, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { EstimateType } from '../type/estimate.type';

@InputType()
export class EstimateFilterInput extends PartialType(
  OmitType(EstimateType, ['createdAt', 'updatedAt'] as const),
  InputType
) {
  @Field(() => Date, { nullable: true })
  startTime: Date;

  @Field(() => Date, { nullable: true })
  endTime: Date;
}
