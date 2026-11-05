import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { BundleTypeEnum } from '../enum/bundle.type.enum';
import { BundleCategoryEnum } from '../enum/bundle.category.enum';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';
import { MAX_NOTES, MAX_SHORT_TEXT, MAX_TITLE } from 'src/common/dto/text.limits';

const text = z.string().trim().max(MAX_SHORT_TEXT).nullish();

// Fields shared by create and update (no cross-field rules, so .partial() works)
export const bundleBaseDto = z.object({
  publicationIds: z.array(z.string().uuid()).nullish(),
  type: nativeEnum(BundleTypeEnum).nullish(),
  category: nativeEnum(BundleCategoryEnum).nullish(),
  visibility: nativeEnum(VisibilityEnum).nullish(),
  price: z.number().int().min(1, 'price must be at least 1 credit').nullish(),
  description: z.string().max(MAX_NOTES).nullish(),
  image: z.string().nullish(),
  notes: z.array(z.string().max(MAX_SHORT_TEXT)).nullish(),
  // packages
  name: z.string().trim().min(1).max(MAX_TITLE).nullish(),
  tier: text,
  packageType: text,
  media: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(MAX_SHORT_TEXT),
        image: z.string().nullish()
      })
    )
    .max(300)
    .nullish(),
  coverage: text,
  contentRule: text,
  backlinks: text,
  disclaimer: text,
  sampleUrls: z
    .array(z.string().trim().max(1000).regex(/^https?:\/\/\S+\.\S+$/i, 'Sample link must start with http:// or https://'))
    .max(3, 'Add at most 3 sample links')
    .nullish(),
  language: text,
  tat: text,
  featured: z.boolean().nullish(),
  featuredRank: z.number().int().min(1).max(999).nullish(),
  vendor: text,
  vendorPackageName: text,
  vendorPriceInr: z.number().positive().nullish(),
  markupPercent: z.number().min(0).max(500).nullish(),
  internalNotes: z.string().max(MAX_NOTES).nullish(),
  source: text,
  importBatch: text
});

export const bundleCreateDto = bundleBaseDto.superRefine((d, ctx) => {
  const isPackage = !!d.name;
  if (isPackage) {
    if (!d.media?.length)
      ctx.addIssue({ code: 'custom', path: ['media'], message: 'A package needs at least one media name' });
  } else {
    if (!d.publicationIds?.length)
      ctx.addIssue({ code: 'custom', path: ['publicationIds'], message: 'atleast 1 publicationId is required' });
    if (!d.type || !d.category)
      ctx.addIssue({ code: 'custom', path: ['type'], message: 'type and category are required for a bundle' });
  }
  if (!d.price && !d.vendorPriceInr)
    ctx.addIssue({ code: 'custom', path: ['price'], message: 'price or vendorPriceInr is required' });
});

export class BundleCreateDto extends createZodDto(bundleCreateDto) {}
