import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { articleCreateDto } from './article.create.dto';
import { ArticleStatusEnum } from '../enum/article.status.enum';

const filterDto = articleCreateDto
  .pick({
    status: true,
    userId: true,
    category: true,
    publishType: true
  })
  .extend({
    startTime: z.date().nullish(),
    endTime: z.date().nullish(),
    status: nativeEnum(ArticleStatusEnum).nullish(),
  })
  .partial();

export class ArticleFilterDto extends createZodDto(filterDto) {}
