import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { LanguageEnum } from 'src/common/enum/language.enum';
import { ArticleCategoryEnum } from '../enum/article.category.enum';
import { ArticlePublishTypeEnum } from '../enum/article.publish.type.enum';
import { ArticleStatusEnum } from '../enum/article.status.enum';
import {
  MAX_CONTENT,
  MAX_NOTES,
  MAX_SHORT_TEXT,
  MAX_SUMMARY,
  MAX_TITLE
} from 'src/common/dto/text.limits';

export const articleCreateDto = z.object({
  userId: z.string().uuid(),
  clientId: z.string().uuid(),
  title: z.string().max(MAX_TITLE),
  content: z.string().max(MAX_CONTENT),
  summary: z.string().max(MAX_SUMMARY),
  featureImage: z.string(),
  language: nativeEnum(LanguageEnum).nullish(),
  featureImageDesc: z.string().max(MAX_SUMMARY).nullish(),
  articleImages: z.array(z.string()).nullish(),
  category: nativeEnum(ArticleCategoryEnum).nullish(),
  publishType: nativeEnum(ArticlePublishTypeEnum).nullish(),
  timezone: z.string().nullish(),
  instructions: z.string().max(MAX_NOTES).nullish(),
  notes: z.string().max(MAX_NOTES).nullish(),
  status: nativeEnum(ArticleStatusEnum).nullish(),
  bundleIds: z.array(z.string().uuid()).nullish(),
  publicationIds: z.array(z.string().uuid()).nullish(),
  mediaContact: z
    .object({
      name: z.string().max(MAX_SHORT_TEXT).nullish(),
      email: z.string().max(MAX_SHORT_TEXT).nullish(),
      phone: z.string().nullish(),
      website: z.string().max(MAX_SHORT_TEXT).nullish(),
      address: z.string().max(MAX_SHORT_TEXT).nullish(),
      state: z.string().max(MAX_SHORT_TEXT).nullish(),
      country: z.string().max(MAX_SHORT_TEXT).nullish(),
      facebook: z.string().max(MAX_SHORT_TEXT).nullish(),
      instagram: z.string().max(MAX_SHORT_TEXT).nullish(),
      linkedIn: z.string().max(MAX_SHORT_TEXT).nullish(),
      twitter: z.string().max(MAX_SHORT_TEXT).nullish(),
      youtube: z.string().max(MAX_SHORT_TEXT).nullish(),
      others: z.string().max(MAX_SHORT_TEXT).nullish()
    })
    .nullish(),
  publishAt: z.date().nullish()
});

export class ArticleCreateDto extends createZodDto(articleCreateDto) {}
