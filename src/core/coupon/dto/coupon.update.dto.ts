import { createZodDto } from 'nestjs-zod';
import { couponCreateDto } from './coupon.create.dto';
import { z } from 'nestjs-zod/z';

const couponUpdateDto = couponCreateDto
  .partial()
  .extend({ id: z.string().uuid() });

export class CouponUpdateDto extends createZodDto(couponUpdateDto) {}
