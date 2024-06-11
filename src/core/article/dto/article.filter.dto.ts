import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { articleCreateDto } from './article.create.dto';
import { ArticleStatusEnum } from '../enum/article.status.enum';
import { ArticleCategoryEnum } from '../enum/article.category.enum';

const filterDto = articleCreateDto
  .pick({
    clientId: true,
    status: true,
    userId: true,
    publishType: true
  })
  .extend({
    startTime: z.date().nullish(),
    endTime: z.date().nullish(),
    status: nativeEnum(ArticleStatusEnum).nullish(),
    categories: z.array(nativeEnum(ArticleCategoryEnum)).nullish(),
    prId: z.number().nullish()
  })
  .partial();

export class ArticleFilterDto extends createZodDto(filterDto) {}
