import { Field, InputType, OmitType } from '@nestjs/graphql';
import { PublicationStatsInput } from './publication.stats.input';
import { PublicationType } from '../type/publication.type';

@InputType()
export class PublicationCreateInput extends OmitType(
  PublicationType,
  ['id', 'stats', 'visibility', 'createdAt', 'updatedAt'] as const,
  InputType
) {
  @Field(() => PublicationStatsInput, { nullable: true })
  stats: PublicationStatsInput;
}
