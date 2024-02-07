import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export class OtpVerifyDto extends createZodDto(
  z.object({
    token: z.string().uuid(),
    otp: z.string().length(4)
  })
) {}
