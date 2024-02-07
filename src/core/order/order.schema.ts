import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';

type OrderDocument = Order & Document;

@Schema({ timestamps: true })
class Order extends Document {
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

const OrderSchema = SchemaFactory.createForClass(Order);

type OrderTypeWithoutDocument = Omit<Order, keyof Document> & {
  _id: string;
};

export { Order, OrderDocument, OrderSchema, OrderTypeWithoutDocument };
