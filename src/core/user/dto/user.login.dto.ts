import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { zodEmail } from 'src/common/utils';

const userLoginDto = z.object({
  email: zodEmail(),
  password: z.string()
});

export class UserLoginDto extends createZodDto(userLoginDto) {}
