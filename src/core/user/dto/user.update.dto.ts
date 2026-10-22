import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { MAX_TITLE } from 'src/common/dto/text.limits';

export class UserUpdateDto extends createZodDto(
  z.object({
    _id: z.string().uuid(),
    fullName: z.string().max(MAX_TITLE).optional()
  })
) {}
