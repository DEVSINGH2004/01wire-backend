import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { ClientTypeEnum } from '../enum/client.type.enum';
import { ClientCategoryEnum } from '../enum/client.category.enum';
import {
  MAX_NOTES,
  MAX_SHORT_TEXT,
  MAX_TITLE
} from 'src/common/dto/text.limits';

export const clientCreateDto = z.object({
  userId: z.string().uuid(),
  title: z.string().max(MAX_TITLE),
  type: z.nativeEnum(ClientTypeEnum),
  category: z.nativeEnum(ClientCategoryEnum),
  email: z.string().email(),
  website: z.string().max(MAX_SHORT_TEXT),
  logo: z.string().nullish(),
  notes: z.string().max(MAX_NOTES).nullish(),
  social: z
    .object({
      facebook: z.string().url().nullish(),
      instagram: z.string().url().nullish(),
      linkedIn: z.string().url().nullish(),
      twitter: z.string().url().nullish(),
      youtube: z.string().url().nullish(),
      others: z.string().url().nullish()
    })
    .nullish()
});

export class ClientCreateDto extends createZodDto(clientCreateDto) {}
