import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const keywordJoinDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().nullish()
});

export class KeywordJoinDto extends createZodDto(keywordJoinDto) {}
