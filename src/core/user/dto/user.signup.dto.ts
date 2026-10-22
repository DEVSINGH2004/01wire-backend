import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { zodEmail } from 'src/common/utils';
import { MAX_TITLE } from 'src/common/dto/text.limits';

export const userSignupDto = z.object({
  email: zodEmail(),
  password: z.string(),
  fullName: z.string().max(MAX_TITLE)
});

export class UserSignupDto extends createZodDto(userSignupDto) {}
