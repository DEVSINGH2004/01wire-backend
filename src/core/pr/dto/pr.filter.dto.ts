import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { PrStatusEnum } from '../enum/pr.status.enum';

export const prDto = z.object({
  userId: z.string().uuid(),
  articleId: z.string().uuid(),
  publicationId: z.string().uuid(),
  status: nativeEnum(PrStatusEnum).nullish(),
  rejectionReason: z.string().nullish()
});

const filterDto = prDto
  .omit({
    rejectionReason: true
  })
  .extend({
    startTime: z.date().nullish(),
    endTime: z.date().nullish()
  })
  .partial();

export class PrFilterDto extends createZodDto(filterDto) {}
