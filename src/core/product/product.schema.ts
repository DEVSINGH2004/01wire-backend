import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';

type ProductDocument = Product & Document;

@Schema({ timestamps: true })
class Product extends Document {
  @Prop({ type: String, default: () => uuid.v4() })
  _id: string;

  @Prop({
    type: String,
    required: true
  })
  userId: string;

  @Prop({
    type: [String],
    required: true
  })
  productIds: string[];

  @Prop({
    type: Number,
    required: true
  })
  amount: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const ProductSchema = SchemaFactory.createForClass(Product);

type ProductTypeWithoutDocument = Omit<Product, keyof Document> & {
  _id: string;
};

export { Product, ProductDocument, ProductSchema, ProductTypeWithoutDocument };
