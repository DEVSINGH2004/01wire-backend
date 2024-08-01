import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { TransactionKindEnum } from '../enum/transaction.kind.enum';
import { TransactionTypeEnum } from '../enum/transaction.type.enum';
import { TransactionStatusEnum } from '../enum/transaction.status.enum';

export const transactionCreateDto = z
  .discriminatedUnion('kind', [
    z.object({
      kind: z.enum([
        TransactionKindEnum.CREDITS_100,
        TransactionKindEnum.CREDITS_500,
        TransactionKindEnum.CREDITS_1000,
        TransactionKindEnum.CREDITS_5000
      ]),
      type: z
        .literal(TransactionTypeEnum.CREDIT)
        .default(TransactionTypeEnum.CREDIT)
    }),
    z.object({
      kind: z.enum([
        TransactionKindEnum.WALLET,
        TransactionKindEnum.ADMIN_UPDATE
      ]),
      type: z.nativeEnum(TransactionTypeEnum),
      amount: z.number(),
      status: z
        .literal(TransactionStatusEnum.SUCCESS)
        .optional()
        .default(TransactionStatusEnum.SUCCESS)
    })
  ])
  .and(
    z.object({
      coupon: z.string().length(6).toUpperCase().nullish(),
      notes: z.string().optional()
    })
  );

export const TransactionCreateDto = createZodDto(transactionCreateDto);
export type TransactionCreateDto = z.infer<typeof transactionCreateDto>;
