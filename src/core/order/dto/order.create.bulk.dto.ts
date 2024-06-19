import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const orderCreateBulkDto = z.object({
  userId: z.string().uuid(),
  articleId: z.string().uuid(),
  prId: z.number(),
  publicationIds: z.array(z.string().uuid()),
  bundleIds: z.array(z.string().uuid()) // can be empty
});

export class OrderCreateBulkDto extends createZodDto(orderCreateBulkDto) {}
