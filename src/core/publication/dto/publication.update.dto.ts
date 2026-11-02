import { createZodDto } from 'nestjs-zod';
import { publicationBaseDto } from './publication.create.dto';
import { z } from 'nestjs-zod/z';

const publicationUpdateDto = publicationBaseDto.partial().extend({
  id: z.string().uuid()
});

export class PublicationUpdateDto extends createZodDto(publicationUpdateDto) {}
