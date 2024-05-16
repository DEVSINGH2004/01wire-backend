import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { PrStatusEnum } from '../enum/pr.status.enum';

const prUpdateStatusDto = z.object({
  id: z.string().uuid(),
  status: nativeEnum(PrStatusEnum).nullish(),
  rejectionReason: z.string().nullish(),
  url: z.string().url().nullish()
});

export class PrUpdateStatusDto extends createZodDto(prUpdateStatusDto) {}
