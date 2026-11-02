import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid';

export enum PaymentOrderStatusEnum {
  PENDING = 'PENDING',
  // Money received and credits added to the wallet
  PAID = 'PAID'
}

type PaymentOrderDocument = PaymentOrder & Document;

// One payment attempt through a gateway (Razorpay) for one PR.
@Schema({ timestamps: true, collection: 'payment_orders' })
class PaymentOrder {
  @Prop({ type: String, default: () => uuid() })
  _id: string;

  @Prop({ type: String, required: true, default: 'RAZORPAY' })
  provider: string;

  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true, index: true })
  articleId: string;

  @Prop({ type: Number })
  prId: number;

  // Credits this payment buys (= the PR total when the order was created)
  @Prop({ type: Number, required: true })
  credits: number;

  // Amount charged, in paise
  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, default: 'INR' })
  currency: string;

  // INR per credit used for the amount
  @Prop({ type: Number, required: true })
  rate: number;

  @Prop({ type: String, required: true, unique: true })
  gatewayOrderId: string;

  @Prop({ type: String, default: null })
  gatewayPaymentId: string;

  @Prop({ type: String, enum: PaymentOrderStatusEnum, default: PaymentOrderStatusEnum.PENDING })
  status: PaymentOrderStatusEnum;

  @Prop({ type: Date, default: null })
  paidAt: Date;

  // Set when the PR could not be submitted after payment (credits stay in the wallet)
  @Prop({ type: String, default: null })
  submitError: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const PaymentOrderSchema = SchemaFactory.createForClass(PaymentOrder);

export { PaymentOrder, PaymentOrderDocument, PaymentOrderSchema };
