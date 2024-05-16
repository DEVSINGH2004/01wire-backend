import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { PrStatusEnum } from '../enum/pr.status.enum';

const filterDto = z.object({
  userId: z.string().uuid().nullish(),
  articleId: z.string().uuid().nullish(),
  publicationId: z.string().uuid().nullish(),
  status: nativeEnum(PrStatusEnum).nullish(),
  rejectionReason: z.string().nullish(),
  startTime: z.date().nullish(),
  endTime: z.date().nullish()
});

export class PrFilterDto extends createZodDto(filterDto) {}
