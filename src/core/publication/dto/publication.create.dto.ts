import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { PublicationCategoryEnum } from '../enum/publication.category.enum';
import { PublicationLinkTypeEnum } from '../enum/publication.link.type.enum';
import { PublicationTimelineEnum } from '../enum/publication.timeline.enum';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';
import { MAX_TITLE } from 'src/common/dto/text.limits';

export const publicationCreateDto = z.object({
  title: z.string().max(MAX_TITLE),
  image: z.string(),
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
  linkType: nativeEnum(PublicationLinkTypeEnum),
  url: z.string().url().nullish(),
  timeline: nativeEnum(PublicationTimelineEnum),
  price: z.coerce.number().min(0)
});

export class PublicationCreateDto extends createZodDto(publicationCreateDto) {}
