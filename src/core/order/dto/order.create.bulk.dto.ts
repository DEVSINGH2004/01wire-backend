import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const orderCreateBulkDto = z.object({
  articleId: z.string().uuid(),
  publicationIds: z.array(z.string().uuid())
});

export class OrderCreateBulkDto extends createZodDto(orderCreateBulkDto) {}
