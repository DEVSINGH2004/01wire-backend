import { createZodDto } from 'nestjs-zod';
import { articleDto } from './article.dto';

const articleCreateDto = articleDto.omit({
  id: true,
  status: true
});

export class ArticleCreateDto extends createZodDto(articleCreateDto) {}
