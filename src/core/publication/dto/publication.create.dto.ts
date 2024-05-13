import { createZodDto } from 'nestjs-zod';
import { nativeEnum, z } from 'nestjs-zod/z';
import { PublicationCategoryEnum } from '../enum/publication.category.enum';
import { PublicationLinkTypeEnum } from '../enum/publication.link.type.enum';
import { PublicationTimelineEnum } from '../enum/publication.timeline.enum';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';

export const publicationCreateDto = z.object({
  title: z.string(),
  image: z.string(),
  stats: z
    .object({
      da: z.number().nullish(),
      pa: z.number().nullish(),
      dr: z.number().nullish(),
      ur: z.number().nullish(),
      traffic: z.number().nullish()
    })
    .nullish(),
  categories: z.array(nativeEnum(PublicationCategoryEnum)),
  visibility: nativeEnum(VisibilityEnum).nullish(),
  linkType: nativeEnum(PublicationLinkTypeEnum),
  url: z.string().url().nullish(),
  timeline: nativeEnum(PublicationTimelineEnum),
  price: z.number().min(0)
});

export class PublicationCreateDto extends createZodDto(publicationCreateDto) {}
