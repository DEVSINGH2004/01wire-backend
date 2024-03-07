import { createZodDto } from 'nestjs-zod';
import { publicationCreateDto } from './publication.create.dto';
import { z } from 'nestjs-zod/z';

const publicationUpdateDto = publicationCreateDto.partial().extend({
  id: z.string().uuid()
});

export class PublicationUpdateDto extends createZodDto(publicationUpdateDto) {}
