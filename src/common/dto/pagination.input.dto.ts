import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

// Single page-size cap for every filter*Paginated query
export const MAX_PER_PAGE = 200;

export class PaginationInputDto extends createZodDto(
  z.object({
    // 0-indexed: currentPage 0 is the first page
    currentPage: z.coerce
      .number()
      .int('currentPage must be an integer')
      .min(0, 'currentPage must be >= 0')
      .default(0),
    perPage: z.coerce
      .number()
      .int('perPage must be an integer')
      .min(1, 'perPage must be >= 1')
      .default(10)
      .transform((val) => Math.min(val, MAX_PER_PAGE))
  })
) {}
