import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { KeywordTypeEnum } from '../enum/keyword.type.enum';

const keywordFilterDto = z.object({
  type: z.nativeEnum(KeywordTypeEnum).nullish()
});

export class KeywordFilterDto extends createZodDto(keywordFilterDto) {}
