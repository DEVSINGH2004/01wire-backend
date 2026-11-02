import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PublicationCategoryEnum } from './enum/publication.category.enum';
import { PublicationLinkTypeEnum } from './enum/publication.link.type.enum';
import { PublicationTimelineEnum } from './enum/publication.timeline.enum';
import * as uuid from 'uuid';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';

type PublicationDocument = Publication & Document;

@Schema({ timestamps: true })
class Publication extends Document {
  @Prop({ type: String, default: () => uuid.v4() })
  _id: string;

  @Prop({
    type: String,
    required: true
  })
  title: string;

  // Logo; optional for imported sites without one (the marketplace shows initials)
  @Prop({
    type: String,
    default: null
  })
  image: string;

  @Prop(
    raw({
      da: { type: Number, default: 0 },
      pa: { type: Number, default: 0 },
      dr: { type: Number, default: 0 },
      ur: { type: Number, default: 0 },
      traffic: { type: Number, default: 0 }
    })
  )
  stats: {
    da: number;
    pa: number;
    dr: number;
    ur: number;
    traffic: number;
  };

  @Prop({
    type: [String],
    enum: PublicationCategoryEnum,
    required: true
  })
  categories: PublicationCategoryEnum[];

  @Prop({
    type: String,
    enum: VisibilityEnum,
    // New publications start hidden until an admin publishes them
    default: VisibilityEnum.SUPPRESSED
  })
  visibility: VisibilityEnum;

  // Blank when the vendor did not say
  @Prop({
    type: String,
    enum: PublicationLinkTypeEnum,
    default: null
  })
  linkType: PublicationLinkTypeEnum;

  @Prop({
    type: String
  })
  url: string;

  @Prop({
    type: String,
    enum: PublicationTimelineEnum,
    default: null
  })
  timeline: PublicationTimelineEnum;

  // Client price in credits. Derived from vendorPriceInr when that is set.
  @Prop({
    type: Number,
    required: true
  })
  price: number;

  // ---- Marketplace listing (one publication = one offering of a website) ----
  @Prop({ type: String, default: null, index: true })
  domain: string;

  // e.g. "Hindi · 2 backlinks · No-follow"; with domain it identifies the offering
  @Prop({ type: String, default: null })
  variantLabel: string;

  @Prop({ type: String, default: null })
  description: string;

  // Topic slugs, e.g. news-media, crypto, gaming-casino
  @Prop({ type: [String], default: [] })
  topics: string[];

  @Prop({ type: String, default: null })
  sampleUrl: string;

  // Turnaround as quoted, e.g. "48 hrs", "3–5 days"
  @Prop({ type: String, default: null })
  tat: string;

  // Yes / No / Maybe
  @Prop({ type: String, default: null })
  indexed: string;

  // Number of backlinks as quoted ("0" = no link, "1-2" kept as written)
  @Prop({ type: String, default: null })
  backlinks: string;

  @Prop({ type: String, default: null })
  language: string;

  // Standard / Corporate / Author / Brand Post / Organic ...
  @Prop({ type: String, default: null })
  tier: string;

  // General / Casino / Crypto / Health / Review
  @Prop({ type: String, default: null })
  section: string;

  @Prop({ type: String, default: null })
  validity: string;

  @Prop({ type: String, default: null })
  niche: string;

  @Prop({ type: String, default: null })
  wordsAllowed: string;

  @Prop({ type: String, default: null })
  disclaimer: string;

  // ---- Admin only (never returned to users) ----
  @Prop({ type: Number, default: null })
  vendorPriceInr: number;

  // Overrides of the default pricing settings; null = use the default
  @Prop({ type: Number, default: null })
  markupPercent: number;

  @Prop({ type: Number, default: null })
  gstPercent: number;

  @Prop({ type: String, default: null })
  sourceVendor: string;

  @Prop({ type: String, default: null })
  internalNotes: string;

  // Tag of the import run that created the record, so a run can be undone
  @Prop({ type: String, default: null })
  importBatch: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const PublicationSchema = SchemaFactory.createForClass(Publication);

type PublicationTypeWithoutDocument = Omit<Publication, keyof Document> & {
  _id: string;
};

export {
  Publication,
  PublicationDocument,
  PublicationSchema,
  PublicationTypeWithoutDocument
};
