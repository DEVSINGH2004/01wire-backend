import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const estimateCreateDto = z.object({
  title: z.string(),
  userId: z.string().uuid(),
  bundleIds: z.array(z.string().uuid()),
  publicationIds: z.array(z.string().uuid())
});

export class EstimateCreateDto extends createZodDto(estimateCreateDto) {}
