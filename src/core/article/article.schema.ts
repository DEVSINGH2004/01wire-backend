import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';
import { ArticleStatusEnum } from './enum/article.status.enum';

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
    type: String,
    required: true
  })
  title: string;

  @Prop({
    type: String,
    required: true
  })
  content: string;

  @Prop({
    type: String,
    default: null
  })
  summary: string;

  @Prop({
    type: String,
    default: null
  })
  featureImage: string;

  @Prop({
    type: [String],
    default: []
  })
  articleImages: string[];

  @Prop({
    type: String,
    default: ArticleStatusEnum.DRAFT
  })
  status: ArticleStatusEnum;

  @Prop({
    type: String,
    default: null
  })
  notes: string;

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
