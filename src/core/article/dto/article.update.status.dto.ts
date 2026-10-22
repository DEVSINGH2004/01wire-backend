import { createZodDto } from 'nestjs-zod';
import { articleCreateDto } from './article.create.dto';
import { z } from 'nestjs-zod/z';
import { MAX_NOTES } from 'src/common/dto/text.limits';

const articleUpdateStatusDto = articleCreateDto
  .partial()
  .pick({
    status: true
  })
  .extend({
    id: z.string().uuid(),
    notes: z.string().max(MAX_NOTES).nullish()
  });

export class ArticleUpdateStatusDto extends createZodDto(
  articleUpdateStatusDto
) {}
