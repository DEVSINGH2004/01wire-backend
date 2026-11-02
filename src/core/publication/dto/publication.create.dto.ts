import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { PublicationCategoryEnum } from '../enum/publication.category.enum';
import { PublicationLinkTypeEnum } from '../enum/publication.link.type.enum';
import { PublicationTimelineEnum } from '../enum/publication.timeline.enum';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';
import {
  MAX_NOTES,
  MAX_SHORT_TEXT,
  MAX_TITLE
} from 'src/common/dto/text.limits';

const shortText = z.string().max(MAX_SHORT_TEXT).nullish();

// Marketplace fields shared by create, update and import
export const publicationListingFields = {
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, 'Enter a domain like example.com')
    .nullish(),
  variantLabel: shortText,
  description: z.string().max(300).nullish(),
  topics: z.array(z.string().max(40)).max(10).nullish(),
  sampleUrl: z.string().url().max(2000).nullish(),
  tat: z.string().max(40).nullish(),
  indexed: shortText,
  backlinks: z.string().max(20).nullish(),
  language: z.string().max(40).nullish(),
  tier: z.string().max(40).nullish(),
  section: z.string().max(40).nullish(),
  validity: z.string().max(40).nullish(),
  niche: shortText,
  wordsAllowed: z.string().max(40).nullish(),
  disclaimer: z.string().max(60).nullish(),
  vendorPriceInr: z.coerce.number().min(0).nullish(),
  markupPercent: z.coerce.number().min(0).max(1000).nullish(),
  gstPercent: z.coerce.number().min(0).max(100).nullish(),
  sourceVendor: shortText,
  internalNotes: z.string().max(MAX_NOTES).nullish(),
  importBatch: z.string().max(60).nullish()
};

export const publicationBaseDto = z.object({
  title: z.string().max(MAX_TITLE),
  image: z.string().nullish(),
  stats: z
    .object({
      da: z.coerce.number().nullish(),
      pa: z.coerce.number().nullish(),
      dr: z.coerce.number().nullish(),
      ur: z.coerce.number().nullish(),
      traffic: z.coerce.number().nullish()
    })
    .nullish(),
  categories: z.array(nativeEnum(PublicationCategoryEnum)),
  visibility: nativeEnum(VisibilityEnum).nullish(),
  linkType: nativeEnum(PublicationLinkTypeEnum).nullish(),
  url: z.string().url().nullish(),
  timeline: nativeEnum(PublicationTimelineEnum).nullish(),
  // Required unless vendorPriceInr is given (then it is calculated)
  price: z.coerce.number().min(0).nullish(),
  ...publicationListingFields
});

export const publicationCreateDto = publicationBaseDto.refine(
  (v) => v.price != null || v.vendorPriceInr != null,
  { message: 'Enter a price or a vendor price (INR)', path: ['price'] }
);

export class PublicationCreateDto extends createZodDto(publicationCreateDto) {}
