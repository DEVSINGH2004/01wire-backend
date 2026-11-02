import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';

const filterDto = z.object({
  filterIds: z.array(z.string().uuid()).nullish(),
  visibility: z.array(nativeEnum(VisibilityEnum)).nullish(),
  title: z.string().max(254).nullish(),
  search: z.string().max(254).nullish(),
  section: z.string().max(40).nullish(),
  language: z.string().max(40).nullish(),
  priceMin: z.coerce.number().min(0).nullish(),
  priceMax: z.coerce.number().min(0).nullish(),
  importBatch: z.string().max(60).nullish()
});

export class PublicationFilterDto extends createZodDto(filterDto) {}
