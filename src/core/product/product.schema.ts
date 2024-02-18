import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';
import { ProductLinkTypeEnum } from './enum/product.link.type.enum';
import { ProductCategoryEnum } from './enum/product.category.enum';
import { ProductTimelineEnum } from './enum/product.timeline.enum';

type ProductDocument = Product & Document;

@Schema({ timestamps: true })
class Product extends Document {
  @Prop({ type: String, default: () => uuid.v4() })
  _id: string;

  @Prop({
    type: String,
    required: true
  })
  title: string;

  @Prop({
    type: String,
    required: true
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
    enum: ProductCategoryEnum,
    required: true
  })
  categories: ProductCategoryEnum[];

  @Prop({
    type: String,
    enum: ProductLinkTypeEnum,
    required: true
  })
  linkType: ProductLinkTypeEnum;

  @Prop({
    type: String
  })
  sampleUrl: string;

  @Prop({
    type: String,
    enum: ProductTimelineEnum,
    default: ProductTimelineEnum.WEEK_1
  })
  timeline: ProductTimelineEnum;

  @Prop({
    type: Number,
    required: true
  })
  price: number;

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
