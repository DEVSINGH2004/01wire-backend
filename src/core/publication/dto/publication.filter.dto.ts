import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const filterDto = z.object({
  filterIds: z.array(z.string().uuid()).nullish()
});

export class PublicationFilterDto extends createZodDto(filterDto) {}
