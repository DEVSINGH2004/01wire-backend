import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { OrderStatusEnum } from '../enum/order.status.enum';
import { MAX_NOTES } from 'src/common/dto/text.limits';

const orderUpdateStatusDto = z.object({
  id: z.string().uuid(),
  status: nativeEnum(OrderStatusEnum).nullish(),
  notes: z.string().max(MAX_NOTES).nullish(),
  url: z.string().url().nullish()
});

export class OrderUpdateStatusDto extends createZodDto(orderUpdateStatusDto) {}
