import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';

type EstimateDocument = Estimate & Document;

@Schema({ timestamps: true })
class Estimate extends Document {
  @Prop({ type: String, default: () => uuid.v4() })
  _id: string;

  @Prop({
    type: String,
    index: true,
    required: true
  })
  userId: string;

  @Prop({
    type: String,
    required: true
  })
  title: string;

  @Prop({
    type: [String],
    default: null
  })
  publicationIds: string[];

  @Prop({
    type: [String],
    default: null
  })
  bundleIds: string[];

  @Prop({
    type: Number,
    default: 0
  })
  totalCredits: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const EstimateSchema = SchemaFactory.createForClass(Estimate);

type EstimateTypeWithoutDocument = Omit<Estimate, keyof Document> & {
  _id: string;
};

export {
  Estimate,
  EstimateDocument,
  EstimateSchema,
  EstimateTypeWithoutDocument
};
