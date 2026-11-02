import { Field, Float, ID, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';
import { PublicationLinkTypeEnum } from '../../enum/publication.link.type.enum';

export enum PublicationBulkActionEnum {
  PUBLISH = 'PUBLISH',
  SUPPRESS = 'SUPPRESS',
  DELETE = 'DELETE',
  SET_MARKUP = 'SET_MARKUP'
}
registerEnumType(PublicationBulkActionEnum, { name: 'PublicationBulkActionEnum' });

@InputType()
export class PublicationBulkInput {
  @Field(() => [ID])
  ids: string[];

  @Field(() => PublicationBulkActionEnum)
  action: PublicationBulkActionEnum;

  // SET_MARKUP only; null clears the override (back to the default markup)
  @Field(() => Float, { nullable: true })
  markupPercent: number;
}

@InputType()
export class PublicationSettingsInput {
  @Field(() => Float, { nullable: true })
  markupPercent: number;

  @Field(() => Float, { nullable: true })
  gstPercent: number;

  @Field(() => Float, { nullable: true })
  usdInrRate: number;
}

// One offering from a sheet. Rows are matched to existing publications by domain + variantLabel.
@InputType()
export class PublicationImportRowInput {
  @Field(() => String)
  title: string;

  @Field(() => String)
  domain: string;

  @Field(() => String, { nullable: true })
  variantLabel: string;

  @Field(() => String, { nullable: true })
  image: string;

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

  @Field(() => PublicationLinkTypeEnum, { nullable: true })
  linkType: PublicationLinkTypeEnum;

  @Field(() => Int, { nullable: true })
  da: number;

  @Field(() => Int, { nullable: true })
  dr: number;

  @Field(() => Float)
  vendorPriceInr: number;

  @Field(() => String, { nullable: true })
  sourceVendor: string;

  @Field(() => String, { nullable: true })
  internalNotes: string;

  // Only used for new publications; existing ones keep their visibility
  @Field(() => VisibilityEnum, { nullable: true })
  visibility: VisibilityEnum;
}

@InputType()
export class PublicationImportInput {
  @Field(() => [PublicationImportRowInput])
  rows: PublicationImportRowInput[];

  // true = report what would change, write nothing
  @Field(() => Boolean, { defaultValue: true })
  dryRun: boolean;

  @Field(() => String, { nullable: true })
  importBatch: string;
}
