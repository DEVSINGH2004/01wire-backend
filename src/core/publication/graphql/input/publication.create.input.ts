import { Field, InputType, Int, OmitType } from '@nestjs/graphql';
import { PublicationStatsInput } from './publication.stats.input';
import { PublicationType } from '../type/publication.type';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';

@InputType()
export class PublicationCreateInput extends OmitType(
  PublicationType,
  ['id', 'stats', 'visibility', 'price', 'createdAt', 'updatedAt'] as const,
  InputType
) {
  @Field(() => PublicationStatsInput, { nullable: true })
  stats: PublicationStatsInput;

  // Calculated from vendorPriceInr when that is given
  @Field(() => Int, { nullable: true })
  price: number;

  // New publications start hidden unless set
  @Field(() => VisibilityEnum, { nullable: true })
  visibility: VisibilityEnum;
}
