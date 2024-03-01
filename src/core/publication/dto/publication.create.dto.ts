import { createZodDto } from 'nestjs-zod';
import { publicationDto } from './publication.dto';

const publicationCreateDto = publicationDto.omit({
  id: true,
  status: true
});

export class PublicationCreateDto extends createZodDto(publicationCreateDto) {}
