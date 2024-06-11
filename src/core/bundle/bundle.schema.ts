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

  @Prop({
    type: String,
    enum: BundleTypeEnum,
    required: true
  })
  type: BundleTypeEnum;

  @Prop({
    type: String,
    enum: BundleCategoryEnum,
    required: true
  })
  category: BundleCategoryEnum;

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
