import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { PublicationStatsType } from './publication.stats.type';
import { PublicationCategoryEnum } from '../../enum/publication.category.enum';
import { PublicationLinkTypeEnum } from '../../enum/publication.link.type.enum';
import { PublicationTimelineEnum } from '../../enum/publication.timeline.enum';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';

@ObjectType('PublicationType')
export class PublicationType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  image: string;

  @Field(() => PublicationStatsType)
  stats: PublicationStatsType;

  @Field(() => [PublicationCategoryEnum])
  categories: PublicationCategoryEnum[];

  @Field(() => PublicationLinkTypeEnum, { nullable: true })
  linkType: PublicationLinkTypeEnum;

  @Field(() => String, { nullable: true })
  url: string;

  @Field(() => PublicationTimelineEnum, { nullable: true })
  timeline: PublicationTimelineEnum;

  @Field(() => VisibilityEnum)
  visibility: VisibilityEnum;

  @Field(() => Int)
  price: number;

  // ---- Marketplace listing ----
  @Field(() => String, { nullable: true })
  domain: string;

  @Field(() => String, { nullable: true })
  variantLabel: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => [String], { nullable: true })
  topics: string[];

  @Field(() => String, { nullable: true })
  sampleUrl: string;

  @Field(() => String, { nullable: true })
  tat: string;

  @Field(() => String, { nullable: true })
  indexed: string;

  @Field(() => String, { nullable: true })
  backlinks: string;

  @Field(() => String, { nullable: true })
  language: string;

  @Field(() => String, { nullable: true })
  tier: string;

  @Field(() => String, { nullable: true })
  section: string;

  @Field(() => String, { nullable: true })
  validity: string;

  @Field(() => String, { nullable: true })
  niche: string;

  @Field(() => String, { nullable: true })
  wordsAllowed: string;

  @Field(() => String, { nullable: true })
  disclaimer: string;

  // ---- Admin only: resolved to null for everyone else (PublicationResolver) ----
  @Field(() => Float, { nullable: true })
  vendorPriceInr: number;

  @Field(() => Float, { nullable: true })
  markupPercent: number;

  @Field(() => Float, { nullable: true })
  gstPercent: number;

  @Field(() => String, { nullable: true })
  sourceVendor: string;

  @Field(() => String, { nullable: true })
  internalNotes: string;

  @Field(() => String, { nullable: true })
  importBatch: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
