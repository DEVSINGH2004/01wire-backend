import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { ArticleStatusEnum } from '../enum/article.status.enum';

const filterDto = z.object({
  status: z.nativeEnum(ArticleStatusEnum).nullish(),
  startTime: z.date().nullish(),
  endTime: z.date().nullish()
});

export class ArticleFilterDto extends createZodDto(filterDto) {}
