import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { BundleTypeEnum } from '../enum/bundle.type.enum';
import { BundleCategoryEnum } from '../enum/bundle.category.enum';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';

export const bundleCreateDto = z.object({
  publicationIds: z
    .array(z.string().uuid())
    .nonempty('atleast 1 publicationId is required'),
  type: nativeEnum(BundleTypeEnum),
  category: nativeEnum(BundleCategoryEnum),
  visibility: nativeEnum(VisibilityEnum).nullish(),
  price: z.number().min(0, 'price cannot be 0'),
  description: z.string().nullish(),
  image: z.string().nullish(),
  notes: z.array(z.string()).nullish()
});

export class BundleCreateDto extends createZodDto(bundleCreateDto) {}
