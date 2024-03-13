import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { transactionCreateDto } from './transaction.create.dto';
import { TransactionTypeEnum } from '../enum/transaction.type.enum';
import { TransactionStatusEnum } from '../enum/transaction.status.enum';
import { TransactionKindEnum } from '../enum/transaction.kind.enum';

const filterDto = transactionCreateDto
  .pick({
    kind: true
  })
  .extend({
    type: nativeEnum(TransactionTypeEnum).nullish(),
    status: nativeEnum(TransactionStatusEnum).nullish(),
    kind: nativeEnum(TransactionKindEnum).nullish(),
    startTime: z.date().nullish(),
    endTime: z.date().nullish()
  })
  .partial();

export class TransactionFilterDto extends createZodDto(filterDto) {}
