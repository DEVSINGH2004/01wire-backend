import { createZodDto } from 'nestjs-zod';
import { articleCreateDto } from './article.create.dto';
import { z } from 'nestjs-zod/z';

const articleUpdateStatusDto = articleCreateDto
  .partial()
  .pick({
    status: true
  })
  .extend({
    id: z.string().uuid(),
    rejectionReason: z.string().nullish()
  });

export class ArticleUpdateStatusDto extends createZodDto(
  articleUpdateStatusDto
) {}
