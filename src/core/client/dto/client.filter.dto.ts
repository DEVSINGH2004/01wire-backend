import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { ClientTypeEnum } from '../enum/client.type.enum';

const filterDto = z.object({
  type: z.nativeEnum(ClientTypeEnum).nullish(),
  startTime: z.date().nullish(),
  endTime: z.date().nullish()
});

export class ClientFilterDto extends createZodDto(filterDto) {}
