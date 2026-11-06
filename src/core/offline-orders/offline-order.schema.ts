import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as uuid from 'uuid';

// An order taken outside the dashboard (e.g. a WhatsApp group), imported from the monthly sheet.
// Admin-only: holds vendor names and costs. Never linked to customer accounts, wallets or emails.
@Schema({ timestamps: true, collection: 'offline_orders' })
class OfflineOrder {
  @Prop({ type: String, default: () => uuid.v4() })
  _id: string;

  @Prop({ type: Date, required: true, index: true })
  orderDate: Date; // stored at 12:00 UTC of the sheet date, so the calendar day never shifts

  @Prop({ type: String, required: true, index: true })
  customerGroup: string; // e.g. "MA x 01Wire"

  @Prop({ type: String, default: null })
  articleLink: string; // Google Doc etc.

  @Prop({ type: String, default: null })
  articleNote: string; // e.g. "Article sent in the word file"

  @Prop({ type: String, default: null })
  orderType: string; // sheet "Order" column (always "Give" so far)

  @Prop({ type: Number, required: true })
  amountPaid: number; // ₹ the customer paid us

  @Prop({ type: String, required: true })
  item: string; // site or package as written in the sheet

  @Prop({ type: String, default: null })
  matchedPublicationId: string; // set when a single site matches our catalogue

  @Prop({ type: String, default: 'PAID' })
  customerPaymentStatus: string; // PAID | UNPAID

  @Prop({ type: String, required: true, index: true })
  status: string; // DELIVERED | NOT_DELIVERED

  @Prop({ type: Date, default: null })
  deliveredAt: Date;

  @Prop({ type: String, default: null })
  liveLink: string; // first live link (kept for simple lists)

  @Prop({ type: [String], default: [] })
  liveLinks: string[]; // every live link (a package is published on several sites)

  @Prop({ type: String, default: null })
  liveNote: string; // e.g. "Delivered report in PDF."

  @Prop({ type: String, default: null, index: true })
  vendor: string; // "We gave order to"

  @Prop({ type: Number, default: 0 })
  vendorCost: number; // ₹ we paid / owe the vendor ("For")

  @Prop({ type: String, default: 'UNPAID', index: true })
  vendorPaymentStatus: string; // PAID | UNPAID

  @Prop({ type: String, default: null })
  vendorOrderStatus: string; // DELIVERED | NOT_DELIVERED

  @Prop({ type: String, default: null })
  vendorPaymentNote: string; // "Payment Link" column (notes, transaction id)

  @Prop({ type: String, default: null })
  notes: string;

  @Prop({ type: String, required: true, index: true })
  importBatch: string; // e.g. "2026-10"

  @Prop({ type: Number, default: null })
  sourceRow: number; // row number in the sheet

  @Prop({ type: String, required: true, index: true })
  dedupeKey: string; // date|group|item|amount|n - re-importing the same sheet never doubles

  @Prop({ type: String, default: null })
  importedBy: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const OfflineOrderSchema = SchemaFactory.createForClass(OfflineOrder);

export { OfflineOrder, OfflineOrderSchema };
