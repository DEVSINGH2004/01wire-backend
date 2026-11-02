import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BundleTypeEnum } from '../../enum/bundle.type.enum';
import { BundleCategoryEnum } from '../../enum/bundle.category.enum';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';

@ObjectType('BundleMediaType')
export class BundleMediaType {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  image?: string;
}

@ObjectType('BundleType')
export class BundleType {
  @Field(() => ID)
  id: string;

  // Empty for packages
  @Field(() => [ID])
  publicationIds: string[];

  @Field(() => String, { nullable: true })
  image: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => BundleTypeEnum, { nullable: true })
  type: BundleTypeEnum;

  @Field(() => BundleCategoryEnum, { nullable: true })
  category: BundleCategoryEnum;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  tier: string;

  @Field(() => String, { nullable: true })
  packageType: string;

  @Field(() => [BundleMediaType], { nullable: true })
  media: BundleMediaType[];

  @Field(() => String, { nullable: true })
  coverage: string;

  @Field(() => String, { nullable: true })
  contentRule: string;

  @Field(() => String, { nullable: true })
  backlinks: string;

  @Field(() => String, { nullable: true })
  disclaimer: string;

  @Field(() => String, { nullable: true })
  language: string;

  @Field(() => String, { nullable: true })
  tat: string;

  // Admin only: resolved to null for everyone else (see BundleResolver)
  @Field(() => String, { nullable: true })
  vendor: string;

  @Field(() => String, { nullable: true })
  vendorPackageName: string;

  @Field(() => Int, { nullable: true })
  vendorPriceInr: number;

  @Field(() => Int, { nullable: true })
  markupPercent: number;

  @Field(() => String, { nullable: true })
  internalNotes: string;

  @Field(() => String, { nullable: true })
  source: string;

  @Field(() => String, { nullable: true })
  importBatch: string;

  @Field(() => String, { nullable: true })
  traffic: string;

  @Field(() => VisibilityEnum)
  visibility: VisibilityEnum;

  @Field(() => Int)
  price: number;

  @Field(() => [String], { nullable: true })
  notes: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
