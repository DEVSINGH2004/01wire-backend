import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const estimateCreateDto = z
  .object({
    title: z.string(),
    userId: z.string().uuid(),
    bundleIds: z
      .array(z.string().uuid())
      .nullish()
      .transform((v) => v ?? []),
    publicationIds: z
      .array(z.string().uuid())
      .nullish()
      .transform((v) => v ?? [])
  })
  .refine((d) => d.bundleIds.length > 0 || d.publicationIds.length > 0, {
    message: 'Select at least one publication or bundle',
    path: ['publicationIds']
  });

export class EstimateCreateDto extends createZodDto(estimateCreateDto) {}
