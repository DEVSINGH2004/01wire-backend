import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';

type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
class Wallet extends Document {
  @Prop({ type: String, default: () => uuid.v4() })
  _id: string;

  @Prop({
    type: String,
    unique: true,
    required: true,
    index: true
  })
  userId: string;

  @Prop({
    type: Number,
    default: 0
  })
  balance: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const WalletSchema = SchemaFactory.createForClass(Wallet);

type WalletTypeWithoutDocument = Omit<Wallet, keyof Document> & {
  _id: string;
};

export { Wallet, WalletDocument, WalletSchema, WalletTypeWithoutDocument };
