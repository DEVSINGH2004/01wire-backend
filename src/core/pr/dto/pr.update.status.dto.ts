import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { prDto } from './pr.filter.dto';

const prUpdateStatusDto = prDto
  .partial()
  .pick({
    status: true
  })
  .extend({
    id: z.string().uuid(),
    rejectionReason: z.string().nullish()
  });

export class PrUpdateStatusDto extends createZodDto(prUpdateStatusDto) {}
