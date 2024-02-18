import { nativeEnum, z } from 'nestjs-zod/z';
import { ArticleStatusEnum } from '../enum/article.status.enum';

export const articleDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().nullish(),
  content: z.string().nullish(),
  summary: z.string().nullish(),
  status: nativeEnum(ArticleStatusEnum).nullish(),
  notes: z.string().nullish()
});
