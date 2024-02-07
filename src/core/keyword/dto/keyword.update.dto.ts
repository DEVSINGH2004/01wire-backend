import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { keywordCreateDto } from './keyword.create.dto';

const keywordUpdateDto = keywordCreateDto
  // .omit({ title: true })
  .extend({
    id: z.string().uuid()
  });

export class KeywordUpdateDto extends createZodDto(keywordUpdateDto) {}
