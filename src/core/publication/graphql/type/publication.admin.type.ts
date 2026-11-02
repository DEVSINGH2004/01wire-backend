import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('PublicationSettingsType')
export class PublicationSettingsType {
  @Field(() => Float)
  markupPercent: number;

  @Field(() => Float)
  gstPercent: number;

  @Field(() => Float)
  usdInrRate: number;

  @Field(() => Date, { nullable: true })
  updatedAt: Date;
}

@ObjectType('PublicationImportIssueType')
export class PublicationImportIssueType {
  @Field(() => Int)
  row: number;

  @Field(() => String, { nullable: true })
  domain: string;

  @Field(() => String)
  reason: string;
}

@ObjectType('PublicationImportResultType')
export class PublicationImportResultType {
  @Field(() => Boolean)
  dryRun: boolean;

  @Field(() => Int)
  added: number;

  @Field(() => Int)
  updated: number;

  @Field(() => Int)
  unchanged: number;

  @Field(() => [PublicationImportIssueType])
  skipped: PublicationImportIssueType[];
}

@ObjectType('PublicationBulkResultType')
export class PublicationBulkResultType {
  @Field(() => Int)
  matched: number;

  @Field(() => Int)
  changed: number;
}
