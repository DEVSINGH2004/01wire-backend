import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { LanguageEnum } from 'src/common/enum/language.enum';
import { ArticleCategoryEnum } from '../enum/article.category.enum';
import { ArticlePublishTypeEnum } from '../enum/article.publish.type.enum';
import { ArticleStatusEnum } from '../enum/article.status.enum';

export const articleCreateDto = z.object({
  userId: z.string().uuid(),
  clientId: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  summary: z.string(),
  featureImage: z.string(),
  language: nativeEnum(LanguageEnum).nullish(),
  featureImageDesc: z.string().nullish(),
  articleImages: z.array(z.string()).nullish(),
  category: nativeEnum(ArticleCategoryEnum).nullish(),
  publishType: nativeEnum(ArticlePublishTypeEnum).nullish(),
  timezone: z.string().nullish(),
  notes: z.string().nullish(),
  status: nativeEnum(ArticleStatusEnum).nullish(),
  bundleIds: z.array(z.string().uuid()).nullish(),
  publicationIds: z.array(z.string().uuid()).nullish(),
  mediaContact: z
    .object({
      name: z.string().nullish(),
      email: z.string().nullish(),
      phone: z.string().nullish(),
      website: z.string().nullish(),
      addres: z.string().nullish(),
      state: z.string().nullish(),
      country: z.string().nullish(),
      facebook: z.string().nullish(),
      instagram: z.string().nullish(),
      linkedIn: z.string().nullish(),
      twitter: z.string().nullish(),
      youtube: z.string().nullish(),
      other: z.string().nullish()
    })
    .nullish(),
  publishAt: z.date().nullish()
});

export class ArticleCreateDto extends createZodDto(articleCreateDto) {}
