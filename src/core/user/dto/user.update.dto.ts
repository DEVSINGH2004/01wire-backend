import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export class UserUpdateDto extends createZodDto(
  z.object({
    _id: z.string().uuid(),
    fullName: z.string().optional()
  })
) {}
