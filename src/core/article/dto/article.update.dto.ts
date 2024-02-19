import { createZodDto } from 'nestjs-zod';
import { articleDto } from './article.dto';

const articleUpdateDto = articleDto.omit({
  status: true
});

export class ArticleUpdateDto extends createZodDto(articleUpdateDto) {}
