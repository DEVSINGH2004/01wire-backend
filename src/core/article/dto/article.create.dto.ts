import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { articleDto } from './article.dto';

const articleCreateDto = articleDto
  .omit({
    id: true,
    status: true
  })
  .extend({
    // clientId: z.string().uuid()
  });

export class ArticleCreateDto extends createZodDto(articleCreateDto) {}
