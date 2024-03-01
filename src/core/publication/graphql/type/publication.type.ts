import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { PublicationStatsType } from './publication.stats.type';
import { PublicationCategoryEnum } from '../../enum/publication.category.enum';
import { PublicationLinkTypeEnum } from '../../enum/publication.link.type.enum';
import { PublicationTimelineEnum } from '../../enum/publication.timeline.enum';

@ObjectType('PublicationType')
export class PublicationType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  image: string;

  @Field(() => PublicationStatsType)
  stats: PublicationStatsType;

  @Field(() => [PublicationCategoryEnum])
  categories: PublicationCategoryEnum[];

  @Field(() => PublicationLinkTypeEnum)
  linkType: PublicationLinkTypeEnum;

  @Field(() => String)
  sampleUrl: string;

  @Field(() => PublicationTimelineEnum)
  timeline: PublicationTimelineEnum;

  @Field(() => Int)
  price: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
