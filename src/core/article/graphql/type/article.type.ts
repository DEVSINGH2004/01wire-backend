import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { ArticleStatusEnum } from '../../enum/article.status.enum';
import { ArticleCategoryEnum } from '../../enum/article.category.enum';
import { ArticlePublishTypeEnum } from '../../enum/article.publish.type.enum';
import { ArticleMediaContactType } from './article.media.contact.type';
import { LanguageEnum } from 'src/common/enum/language.enum';

@ObjectType('ArticleType')
export class ArticleType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  clientId: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  content: string;

  @Field(() => LanguageEnum, { nullable: true })
  language: LanguageEnum;

  @Field(() => String, { nullable: true })
  summary: string;

  @Field(() => String, { nullable: true })
  featureImage: string;

  @Field(() => String, { nullable: true })
  featureImageDesc: string;

  @Field(() => [String], { nullable: true })
  articleImages: string[];

  @Field(() => ArticleStatusEnum, { nullable: true })
  status: ArticleStatusEnum;

  @Field(() => ArticleCategoryEnum, { nullable: true })
  category: ArticleCategoryEnum;

  @Field(() => ArticlePublishTypeEnum, { nullable: true })
  publishType: ArticlePublishTypeEnum;

  @Field(() => String, { nullable: true })
  timezone: string;

  @Field(() => String, { nullable: true })
  notes: string;

  @Field(() => String, { nullable: true })
  rejectionReason: string;

  @Field(() => [String], { nullable: true })
  bundleIds: string[];

  @Field(() => [String], { nullable: true })
  publicationIds: string[];

  @Field(() => ArticleMediaContactType, { nullable: true })
  mediaContact: ArticleMediaContactType;

  @Field(() => Int)
  totalCredits: Number;

  @Field(() => Date, { nullable: true })
  publishAt: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
