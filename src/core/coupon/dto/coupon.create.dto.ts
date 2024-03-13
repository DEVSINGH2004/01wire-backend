import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { CouponTypeEnum } from '../enum/coupon.type.enum';
import { CouponCategoryEnum } from '../enum/coupon.category.enum';

export const couponCreateDto = z.object({
  userId: z.string().uuid().nullish(),
  type: nativeEnum(CouponTypeEnum),
  category: nativeEnum(CouponCategoryEnum),
  value: z.number().min(1, 'value cannot be less than 1'),
  limit: z.number().min(1, 'limit cannot be less than 1'),
  expireAt: z.date()
});

export class CouponCreateDto extends createZodDto(couponCreateDto) {}
