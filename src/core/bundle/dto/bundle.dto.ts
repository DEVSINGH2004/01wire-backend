import { nativeEnum, z } from 'nestjs-zod/z';

export const bundleDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().nullish(),
  content: z.string().nullish(),
  summary: z.string().nullish()
  // status: nativeEnum(ArticleStatusEnum).default(ArticleStatusEnum.DRAFT)
});
