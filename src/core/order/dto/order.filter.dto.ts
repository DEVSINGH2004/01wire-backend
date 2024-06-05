import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { OrderStatusEnum } from '../enum/order.status.enum';

const filterDto = z.object({
  userId: z.string().uuid().nullish(),
  articleId: z.string().uuid().nullish(),
  prId: z.string().uuid().nullish(),
  status: nativeEnum(OrderStatusEnum).nullish(),
  notes: z.string().nullish(),
  startTime: z.date().nullish(),
  endTime: z.date().nullish()
});

export class OrderFilterDto extends createZodDto(filterDto) {}
