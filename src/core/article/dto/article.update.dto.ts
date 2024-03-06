import { createZodDto } from 'nestjs-zod';
import { articleCreateDto } from './article.create.dto';
import { z } from 'nestjs-zod/z';

const articleUpdateDto = articleCreateDto.partial().extend({
  id: z.string().uuid()
});

export class ArticleUpdateDto extends createZodDto(articleUpdateDto) {}
