import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type SequenceDocument = Sequence & Document;

@Schema()
class Sequence extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, default: 0 })
  value: number;
}

const SequenceSchema = SchemaFactory.createForClass(Sequence);

type SequenceTypeWithoutDocument = Omit<Sequence, keyof Document> & {
  _id: string;
};

export {
  Sequence,
  SequenceDocument,
  SequenceSchema,
  SequenceTypeWithoutDocument
};
