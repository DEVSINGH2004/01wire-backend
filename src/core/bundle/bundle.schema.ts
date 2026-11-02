import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BundleTypeEnum } from './enum/bundle.type.enum';
import { BundleCategoryEnum } from './enum/bundle.category.enum';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';
import * as uuid from 'uuid';

type BundleDocument = Bundle & Document;

@Schema({ timestamps: true })
class Bundle extends Document {
  @Prop({ type: String, default: () => uuid.v4() })
  _id: string;

  @Prop({
    type: [String],
    default: []
  })
  publicationIds: string[];

  // Old-style bundles (publications from the Marketplace) use type + category.
  // Packages (vendor PR packages) use name + tier + media instead.
  @Prop({
    type: String,
    enum: [...Object.values(BundleTypeEnum), null],
    default: null
  })
  type: BundleTypeEnum;

  @Prop({
    type: String,
    enum: [...Object.values(BundleCategoryEnum), null],
    default: null
  })
  category: BundleCategoryEnum;

  @Prop({ type: String, default: null, index: true })
  name: string;

  // Starter, Standard, Good, Very Good, Premium, Elite
  @Prop({ type: String, default: null })
  tier: string;

  // e.g. "Wire (same article on all platforms)", "Tech PR", "Hindi PR"
  @Prop({ type: String, default: null })
  packageType: string;

  // Named outlets; image is copied from a matching Marketplace publication
  @Prop({
    type: [{ name: String, image: String, _id: false }],
    default: []
  })
  media: { name: string; image?: string }[];

  // Extra coverage beyond the named media, e.g. "250+ Medias"
  @Prop({ type: String, default: null })
  coverage: string;

  @Prop({ type: String, default: null })
  contentRule: string;

  @Prop({ type: String, default: null })
  backlinks: string;

  @Prop({ type: String, default: null })
  disclaimer: string;

  @Prop({ type: String, default: null })
  language: string;

  @Prop({ type: String, default: null })
  tat: string;

  // "Popular" packages are listed first, in featuredRank order
  @Prop({ type: Boolean, default: false, index: true })
  featured: boolean;

  @Prop({ type: Number, default: null })
  featuredRank: number;

  // ---- admin only (never shown to clients) ----
  @Prop({ type: String, default: null })
  vendor: string;

  @Prop({ type: String, default: null })
  vendorPackageName: string;

  @Prop({ type: Number, default: null })
  vendorPriceInr: number;

  // Overrides the default markup from the pricing settings
  @Prop({ type: Number, default: null })
  markupPercent: number;

  @Prop({ type: String, default: null })
  internalNotes: string;

  @Prop({ type: String, default: null })
  source: string;

  @Prop({ type: String, default: null })
  importBatch: string;

  @Prop({
    type: String,
    enum: VisibilityEnum,
    default: VisibilityEnum.SUPPRESSED
  })
  visibility: VisibilityEnum;

  @Prop({
    type: Number,
    default: 0
  })
  traffic: number;

  @Prop({
    type: Number,
    required: true
  })
  price: number;

  @Prop({
    type: Number,
    required: true
  })
  maxPrice: number;

  @Prop({
    type: String,
    default: null
  })
  description: string;

  @Prop({
    type: String,
    default: null
  })
  image: string;

  @Prop({
    type: [String]
  })
  notes: string[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const BundleSchema = SchemaFactory.createForClass(Bundle);

type BundleTypeWithoutDocument = Omit<Bundle, keyof Document> & {
  _id: string;
};

export { Bundle, BundleDocument, BundleSchema, BundleTypeWithoutDocument };
