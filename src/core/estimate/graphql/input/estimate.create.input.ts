import { InputType, PartialType, PickType } from '@nestjs/graphql';
import { EstimateType } from '../type/estimate.type';

@InputType()
export class EstimateCreateInput extends PartialType(
  PickType(EstimateType, ['publicationIds', 'bundleIds'] as const),
  InputType
) {}
