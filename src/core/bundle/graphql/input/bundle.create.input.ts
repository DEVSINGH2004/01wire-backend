import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { BundleTypeEnum } from '../../enum/bundle.type.enum';
import { BundleCategoryEnum } from '../../enum/bundle.category.enum';

@InputType('BundleMediaInput')
export class BundleMediaInput {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  image?: string;
}

// A bundle is either a set of Marketplace publications (publicationIds + type +
// category) or a package (name + media). Package prices come from the vendor
// price with the same markup / GST / rate as publications.
@InputType()
export class BundleCreateInput {
  @Field(() => [ID], { nullable: true })
  publicationIds?: string[];

  @Field(() => BundleTypeEnum, { nullable: true })
  type?: BundleTypeEnum;

  @Field(() => BundleCategoryEnum, { nullable: true })
  category?: BundleCategoryEnum;

  @Field(() => Int, { nullable: true, description: 'Credits; worked out from vendorPriceInr when that is given' })
  price?: number;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  image?: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  tier?: string;

  @Field(() => String, { nullable: true })
  packageType?: string;

  @Field(() => [BundleMediaInput], { nullable: true })
  media?: BundleMediaInput[];

  @Field(() => String, { nullable: true })
  coverage?: string;

  @Field(() => String, { nullable: true })
  contentRule?: string;

  @Field(() => String, { nullable: true })
  backlinks?: string;

  @Field(() => String, { nullable: true })
  disclaimer?: string;

  @Field(() => String, { nullable: true })
  language?: string;

  @Field(() => String, { nullable: true })
  tat?: string;

  @Field(() => Boolean, { nullable: true })
  featured?: boolean;

  @Field(() => Int, { nullable: true })
  featuredRank?: number;

  @Field(() => String, { nullable: true })
  vendor?: string;

  @Field(() => String, { nullable: true })
  vendorPackageName?: string;

  @Field(() => Int, { nullable: true })
  vendorPriceInr?: number;

  @Field(() => Int, { nullable: true })
  markupPercent?: number;

  @Field(() => String, { nullable: true })
  internalNotes?: string;

  @Field(() => String, { nullable: true })
  source?: string;

  @Field(() => String, { nullable: true })
  importBatch?: string;
}
