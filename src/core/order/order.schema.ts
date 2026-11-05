import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { OrderStatusEnum } from './enum/order.status.enum';
import * as uuid from 'uuid';

type OrderDocument = Order & Document;

@Schema({ timestamps: true })
class Order extends Document {
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
    index: true,
    required: true
  })
  articleId: string;

  @Prop({
    type: Number,
    required: true
  })
  prId: number;

  // null for a package order (bundleId points at the package)
  @Prop({
    type: String,
    default: null
  })
  publicationId: string;

  @Prop({
    type: String,
    default: null
  })
  bundleId: string;

  @Prop({
    type: String,
    enum: OrderStatusEnum,
    default: OrderStatusEnum.PENDING
  })
  status: OrderStatusEnum;

  @Prop({
    type: String,
    default: null
  })
  notes: string;

  @Prop({
    type: String,
    default: null
  })
  url: string;

  @Prop({ type: Date, default: null })
  publishAt: Date;

  @Prop({ type: Date, required: true })
  publishBy: Date;

  // Credits this site/package cost when the PR was paid (used to refund a rejected site)
  @Prop({ type: Number, default: null })
  credits: number;

  // Credits given back to the customer for this order (site rejected)
  @Prop({ type: Number, default: 0 })
  refundedCredits: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const OrderSchema = SchemaFactory.createForClass(Order);

type OrderTypeWithoutDocument = Omit<Order, keyof Document> & {
  _id: string;
};

export { Order, OrderDocument, OrderSchema, OrderTypeWithoutDocument };
