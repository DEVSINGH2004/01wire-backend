import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { zodEmail } from 'src/common/utils';

export const userSignupDto = z.object({
  email: zodEmail(),
  password: z.string(),
  fullName: z.string()
});

export class UserSignupDto extends createZodDto(userSignupDto) {}
