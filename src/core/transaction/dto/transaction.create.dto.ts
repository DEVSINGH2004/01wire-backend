import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { TransactionKindEnum } from '../enum/transaction.kind.enum';

export const transactionCreateDto = z.object({
  kind: nativeEnum(TransactionKindEnum),
  coupon: z.string().length(6).toUpperCase().nullish()
});

export class TransactionCreateDto extends createZodDto(transactionCreateDto) {}
