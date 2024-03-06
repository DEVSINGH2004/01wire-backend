import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { BundleTypeEnum } from '../enum/bundle.type.enum';
import { BundleCategoryEnum } from '../enum/bundle.category.enum';

export const bundleCreateDto = z.object({
  publicationIds: z.array(z.string().uuid()),
  type: nativeEnum(BundleTypeEnum),
  category: nativeEnum(BundleCategoryEnum),
  price: z.number(),
  notes: z.string().nullish(),
  image: z.string().nullish()
});

export class BundleCreateDto extends createZodDto(bundleCreateDto) {}
