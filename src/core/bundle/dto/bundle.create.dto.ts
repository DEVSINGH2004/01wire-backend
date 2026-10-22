import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { BundleTypeEnum } from '../enum/bundle.type.enum';
import { BundleCategoryEnum } from '../enum/bundle.category.enum';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';
import { MAX_NOTES, MAX_SHORT_TEXT } from 'src/common/dto/text.limits';

export const bundleCreateDto = z.object({
  publicationIds: z
    .array(z.string().uuid())
    .nonempty('atleast 1 publicationId is required'),
  type: nativeEnum(BundleTypeEnum),
  category: nativeEnum(BundleCategoryEnum),
  visibility: nativeEnum(VisibilityEnum).nullish(),
  price: z.number().min(0, 'price cannot be 0'),
  description: z.string().max(MAX_NOTES).nullish(),
  image: z.string().nullish(),
  notes: z.array(z.string().max(MAX_SHORT_TEXT)).nullish()
});

export class BundleCreateDto extends createZodDto(bundleCreateDto) {}
