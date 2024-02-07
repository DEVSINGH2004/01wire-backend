import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export class UserResetPasswordDto extends createZodDto(
  z.object({
    _id: z.string().uuid(),
    password: z.string()
  })
) {}
