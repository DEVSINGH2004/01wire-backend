import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ArticleStatusEnum } from '../../enum/article.status.enum';
import { ArticleCategoryEnum } from '../../enum/article.category.enum';
import { ArticlePublishTypeEnum } from '../../enum/article.publish.type.enum';
import { ArticleMediaContactType } from './article.media.contact.type';

@ObjectType('ArticleType')
export class ArticleType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  clientId: string;

  @Field(() => String)
  language: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  content: string;

  @Field(() => String)
  summary: string;

  @Field(() => String)
  featureImage: string;

  @Field(() => String)
  featureImageDesc: string;

  @Field(() => [String])
  articleImages: string[];

  @Field(() => ArticleStatusEnum)
  status: ArticleStatusEnum;

  @Field(() => ArticleCategoryEnum)
  category: ArticleCategoryEnum;

  @Field(() => ArticlePublishTypeEnum)
  publishType: ArticlePublishTypeEnum;

  @Field(() => String)
  timezone: string;

  @Field(() => String)
  notes: string;

  @Field(() => [String])
  bundleIds: string[];

  @Field(() => [String])
  publicationIds: string[];

  @Field(() => ArticleMediaContactType)
  mediaContact: ArticleMediaContactType;

  @Field(() => Date)
  publishAt: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
