import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export class PaginationInputDto extends createZodDto(
  z.object({
    currentPage: z.coerce.number().default(0),
    perPage: z.coerce
      .number()
      .default(10)
      .transform((val) => {
        if (val > 500) {
          return 500;
        }
        return val;
      })
  })
) {}
