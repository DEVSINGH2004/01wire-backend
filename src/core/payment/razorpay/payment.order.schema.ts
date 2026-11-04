import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid';

export enum PaymentOrderStatusEnum {
  PENDING = 'PENDING',
  // Money received and credits added to the wallet
  PAID = 'PAID',
  // Checkout closed before payment (e.g. the PR was paid another way)
  CANCELLED = 'CANCELLED'
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

  // Set once the PR was submitted after this payment (credits debited, orders made)
  @Prop({ type: Date, default: null })
  submittedAt: Date;

  // Set when the PR could not be submitted after payment (credits stay in the wallet)
  @Prop({ type: String, default: null })
  submitError: string;

  // Gateway's own reference people can look up (e.g. Shopify order "#1008")
  @Prop({ type: String, default: null })
  gatewayRef: string;

  // Paid with a gateway's test mode (no real money)
  @Prop({ type: Boolean, default: false })
  test: boolean;

  // Refunded on the gateway so far, in paise, and the credits taken back for it
  @Prop({ type: Number, default: 0 })
  refundedAmount: number;

  @Prop({ type: Number, default: 0 })
  reversedCredits: number;

  // Something a person has to look at (e.g. refund after the PR was submitted);
  // cleared when an admin marks it reviewed
  @Prop({ type: String, default: null, index: true })
  issue: string;

  @Prop({ type: Date, default: null })
  issueAt: Date;

  @Prop({ type: String, default: null })
  reviewedBy: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const PaymentOrderSchema = SchemaFactory.createForClass(PaymentOrder);

export { PaymentOrder, PaymentOrderDocument, PaymentOrderSchema };
