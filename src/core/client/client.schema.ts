import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';
import { ClientTypeEnum } from './enum/client.type.enum';
import { ClientCategoryTypeEnum } from './enum/client.category.enum';

type ClientDocument = Client & Document;

@Schema({ timestamps: true })
class Client extends Document {
  @Prop({
    type: String,
    default: () => uuid.v4()
  })
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
  title: string;

  @Prop({
    type: String,
    enum: ClientTypeEnum,
    required: true
  })
  type: ClientTypeEnum;

  @Prop({
    type: String,
    enum: ClientCategoryTypeEnum,
    required: true
  })
  category: ClientCategoryTypeEnum;

  @Prop({
    type: String,
    required: true
  })
  email: string;

  @Prop({
    type: String,
    default: null
  })
  website: string;

  @Prop({
    type: String,
    default: null
  })
  ticker: string;

  @Prop({
    type: String,
    default: null
  })
  logo: string;

  @Prop(
    raw({
      facebook: { type: String, default: null },
      instagram: { type: String, default: null },
      linkedIn: { type: String, default: null },
      twitter: { type: String, default: null },
      youtube: { type: String, default: null },
      others: { type: String, default: null }
    })
  )
  social: {
    facebook: string;
    instagram: string;
    linkedIn: string;
    twitter: string;
    youtube: string;
    others: string;
  };

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const ClientSchema = SchemaFactory.createForClass(Client);

type ClientTypeWithoutDocument = Omit<Client, keyof Document> & {
  _id: string;
};

export { Client, ClientDocument, ClientSchema, ClientTypeWithoutDocument };
