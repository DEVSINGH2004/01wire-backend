import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { TransactionKindEnum } from './enum/transaction.kind.enum';
import { TransactionStatusEnum } from './enum/transaction.status.enum';
import { TransactionTypeEnum } from './enum/transaction.type.enum';

type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
class Transaction {
  @Prop({ type: String, default: () => uuid() })
  _id: string;

  @Prop({ type: String })
  userId: string;

  @Prop({ type: String })
  walletId: string;

  @Prop({
    enum: TransactionStatusEnum,
    type: String,
    default: TransactionStatusEnum.PENDING
  })
  status: TransactionStatusEnum;

  @Prop({
    enum: TransactionTypeEnum,
    type: String,
    default: TransactionTypeEnum.CREDIT
  })
  type: TransactionTypeEnum;

  @Prop({
    enum: TransactionKindEnum,
    type: String,
    required: true
  })
  kind: TransactionKindEnum;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop()
  notes: string;

  // Admin who made an ADMIN_UPDATE change (null for system/user transactions)
  @Prop({ type: String, default: null })
  performedBy: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const TransactionSchema = SchemaFactory.createForClass(Transaction);

export { Transaction, TransactionDocument, TransactionSchema };
