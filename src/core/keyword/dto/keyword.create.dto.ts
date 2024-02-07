import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const keywordCreateDto = z.object({
  title: z.string(),
  userId: z.string().uuid(),
  keywords: z.array(z.string())
});

export class KeywordCreateDto extends createZodDto(keywordCreateDto) {}
