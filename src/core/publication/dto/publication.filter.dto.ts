import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';

const filterDto = z.object({
  filterIds: z.array(z.string().uuid()).nullish(),
  visibility: z.array(nativeEnum(VisibilityEnum)).nullish(),
  title: z.string().max(254).nullish()
});

export class PublicationFilterDto extends createZodDto(filterDto) {}
