import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const filterDto = z.object({
  userId: z.string().uuid().nullish(),
  startTime: z.date().nullish(),
  endTime: z.date().nullish()
});

export class EstimateFilterDto extends createZodDto(filterDto) {}
