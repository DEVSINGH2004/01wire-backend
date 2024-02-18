import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';

type ClientDocument = Client & Document;

@Schema({ timestamps: true })
class Client extends Document {
  @Prop({ type: String, default: () => uuid.v4() })
  _id: string;

  @Prop({
    type: String,
    required: true
  })
  title: string;

  @Prop({
    type: String,
    required: true
  })
  type: string;

  @Prop({
    type: String,
    default: null
  })
  email: string;

  @Prop({
    type: String,
    default: null
  })
  category: string;

  @Prop({
    type: String,
    default: null
  })
  website: string;

  @Prop({
    type: String,
    default: null
  })
  logo: string;

  @Prop(
    raw({
      facebook: { type: String, default: null },
      linkedIn: { type: String, default: null },
      twitter: { type: String, default: null },
      instagram: { type: String, default: null }
    })
  )
  social: {
    facebook: string;
    linkedIn: string;
    twitter: string;
    instagram: string;
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
