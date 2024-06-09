import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { userSignupDto } from './user.signup.dto';

const filterDto = userSignupDto
  .pick({
    fullName: true
  })
  .extend({
    startTime: z.date().nullish(),
    endTime: z.date().nullish(),
    email: z.string().max(254) // adding email as string so we can do regex search
  })
  .partial();

export class UserFilterDto extends createZodDto(filterDto) {}
