import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
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
  productIds: string[];

  @Prop({
    type: Number,
    required: true
  })
  price: number;

  @Prop({
    type: String,
    default: null
  })
  notes: string;

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
