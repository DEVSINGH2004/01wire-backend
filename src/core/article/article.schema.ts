import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';

type ArticleDocument = Article & Document;

@Schema({ timestamps: true })
class Article extends Document {
  @Prop({ type: String, default: () => uuid.v4() })
  _id: string;

  @Prop({
    type: String,
    required: true
  })
  userId: string;

  @Prop({
    type: [String],
    required: true
  })
  ArticleIds: string[];

  @Prop({
    type: Number,
    required: true
  })
  amount: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

const ArticleSchema = SchemaFactory.createForClass(Article);

type ArticleTypeWithoutDocument = Omit<Article, keyof Document> & {
  _id: string;
};

export { Article, ArticleDocument, ArticleSchema, ArticleTypeWithoutDocument };
