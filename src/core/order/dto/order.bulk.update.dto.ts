import { z } from 'nestjs-zod/z';
import { OrderStatusEnum } from '../enum/order.status.enum';
import { MAX_NOTES } from 'src/common/dto/text.limits';

export const orderBulkUpdateSchema = z.array(
  z
    .discriminatedUnion('status', [
      z.object({
        status: z.literal(OrderStatusEnum.PENDING)
      }),
      z.object({
        status: z.literal(OrderStatusEnum.REJECTED),
        notes: z.string().min(1).max(MAX_NOTES)
      }),

      z.object({
        status: z.literal(OrderStatusEnum.PUBLISHED),
        url: z.preprocess((val) => {
          return typeof val === 'string' ? val : val['text'];
        }, z.string().url())
      })
    ])
    .and(
      z.object({
        orderId: z.string().uuid()
      })
    )
);
