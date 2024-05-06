import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { userSignupDto } from './user.signup.dto';

const filterDto = userSignupDto
  .pick({
    email: true,
    fullName: true
  })
  .extend({
    startTime: z.date().nullish(),
    endTime: z.date().nullish()
  })
  .partial();

export class UserFilterDto extends createZodDto(filterDto) {}
