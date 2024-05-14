import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const prCreateBulkDto = z.object({
  articleId: z.string().uuid(),
  publicationIds: z.array(z.string().uuid())
});

export class PrCreateBulkDto extends createZodDto(prCreateBulkDto) {}
