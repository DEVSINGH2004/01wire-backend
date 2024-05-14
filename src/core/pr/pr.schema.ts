import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PrStatusEnum } from './enum/pr.status.enum';
import * as uuid from 'uuid';

type PrDocument = Pr & Document;

@Schema({ timestamps: true })
class Pr extends Document {
  @Prop({ type: String, default: () => uuid.v4() })
  _id: string;

  @Prop({
    type: String,
    required: true
  })
  userId: string;

  @Prop({
    type: String,
    required: true
  })
  articleId: string;

  @Prop({
    type: String,
    required: true
  })
  publicationId: string;

  @Prop({
    type: String,
    enum: PrStatusEnum,
    default: PrStatusEnum.PENDING
  })
  status: PrStatusEnum;

  @Prop({
    type: String,
    default: null
  })
  rejectionReason: string;

  @Prop({ type: Date, default: null })
  publishAt: Date;

  @Prop({ type: Date, required: true })
  publishBy: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const PrSchema = SchemaFactory.createForClass(Pr);

type PrTypeWithoutDocument = Omit<Pr, keyof Document> & {
  _id: string;
};

export { Pr, PrDocument, PrSchema, PrTypeWithoutDocument };
