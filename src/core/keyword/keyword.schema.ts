import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';
import { KeywordTypeEnum } from './enum/keyword.type.enum';

type KeywordDocument = Keyword & Document;

@Schema({ timestamps: true })
class Keyword extends Document {
  @Prop({ type: String, default: () => uuid.v4() })
  _id: string;

  @Prop({
    type: String,
    required: true
  })
  title: string;

  @Prop({
    type: String,
    enum: KeywordTypeEnum,
    default: KeywordTypeEnum.PRIVATE
  })
  type: KeywordTypeEnum;

  @Prop({
    type: String,
    required: true
  })
  userId: string;

  @Prop({
    type: [String],
    default: []
  })
  keywords: string[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const KeywordSchema = SchemaFactory.createForClass(Keyword);

type KeywordTypeWithoutDocument = Omit<Keyword, keyof Document> & {
  _id: string;
};

export { Keyword, KeywordDocument, KeywordSchema, KeywordTypeWithoutDocument };
