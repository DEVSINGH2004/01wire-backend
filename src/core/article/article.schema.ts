import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as uuid from 'uuid';
import { ArticleStatusEnum } from './enum/article.status.enum';
import { LanguageEnum } from 'src/common/enum/language.enum';
import { ArticleCategoryEnum } from './enum/article.category.enum';
import { ArticlePublishTypeEnum } from './enum/article.publish.type.enum';

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
  clientId: string;

  @Prop({
    type: String,
    enum: [...Object.values(LanguageEnum), null],
    default: null
  })
  language: LanguageEnum;

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
    type: String,
    default: null
  })
  featureImageDesc: string;

  @Prop({
    type: [String],
    default: []
  })
  articleImages: string[];

  @Prop({
    type: String,
    enum: ArticleStatusEnum,
    default: ArticleStatusEnum.DRAFT
  })
  status: ArticleStatusEnum;

  @Prop({
    type: Number,
    default: 0
  })
  totalCredits: number;

  @Prop({
    type: String,
    enum: [...Object.values(ArticleCategoryEnum), null],
    default: null
  })
  category: ArticleCategoryEnum;

  @Prop({
    type: String,
    enum: [...Object.values(ArticlePublishTypeEnum), null],
    default: null
  })
  publishType: ArticlePublishTypeEnum;

  @Prop({
    type: String,
    default: null
  })
  timezone: string;

  @Prop({
    type: String,
    default: null
  })
  notes: string;

  @Prop({
    type: String,
    default: null
  })
  rejectionReason: string;

  @Prop({
    type: [String],
    default: null
  })
  bundleIds: string[];

  @Prop({
    type: [String],
    default: null
  })
  publicationIds: string[];

  @Prop(
    raw({
      name: { type: String, default: null },
      email: { type: String, default: null },
      phone: { type: String, default: null },
      website: { type: String, default: null },
      address: { type: String, default: null },
      state: { type: String, default: null },
      country: { type: String, default: null },
      facebook: { type: String, default: null },
      instagram: { type: String, default: null },
      linkedIn: { type: String, default: null },
      twitter: { type: String, default: null },
      youtube: { type: String, default: null },
      other: { type: String, default: null }
    })
  )
  mediaContact: {
    name: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    state: string;
    country: string;
    facebook: string;
    instagram: string;
    linkedIn: string;
    twitter: string;
    youtube: string;
    other: string;
  };

  @Prop({ type: Date, default: null })
  publishAt: Date;

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
