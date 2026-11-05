import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// The Marketplace cart, copied from the browser so a reminder can be sent. One per user.
@Schema({ timestamps: true, collection: 'carts' })
class Cart {
  @Prop({ type: String })
  _id: string; // = userId

  @Prop({ type: [String], default: [] })
  publicationIds: string[];

  @Prop({ type: [String], default: [] })
  bundleIds: string[];

  // When the cart last went from empty to having items (one reminder series per filling)
  @Prop({ type: Date, default: null })
  startedAt: Date;

  @Prop()
  updatedAt: Date;
}
const CartSchema = SchemaFactory.createForClass(Cart);

// One row per email we send (or tried to): stops duplicates and counts reminders.
@Schema({ timestamps: true, collection: 'email_log' })
class EmailLog {
  @Prop({ type: String })
  _id: string; // receipt:<articleId> | draft:<articleId>:<n> | cart:<userId>:<startedAt>:<n> | credits:<transactionId>

  @Prop({ type: String, index: true })
  kind: string; // RECEIPT | DRAFT_REMINDER | CART_REMINDER | CREDITS_RECEIPT

  @Prop({ type: String, index: true })
  refId: string;

  @Prop({ type: String, index: true })
  userId: string;

  @Prop({ type: String })
  to: string;

  @Prop({ type: Boolean, default: false })
  failed: boolean;

  @Prop({ type: String, default: null })
  error: string;

  @Prop()
  createdAt: Date;
}
const EmailLogSchema = SchemaFactory.createForClass(EmailLog);

export { Cart, CartSchema, EmailLog, EmailLogSchema };
