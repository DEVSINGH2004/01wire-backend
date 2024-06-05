import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { OrderStatusEnum } from '../enum/order.status.enum';

const orderCreateBulkDto = z.object({
  userId: z.string().uuid(),
  articleId: z.string().uuid(),
  status: z.nativeEnum(OrderStatusEnum),
  prId: z.string(),
  publicationIds: z.array(z.string().uuid()),
  bundleIds: z.array(z.string().uuid()) // can be empty
});

export class OrderCreateBulkDto extends createZodDto(orderCreateBulkDto) {}
