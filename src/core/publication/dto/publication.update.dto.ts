import { createZodDto } from 'nestjs-zod';
import { publicationDto } from './publication.dto';

const publicationUpdateDto = publicationDto.omit({});

export class PublicationUpdateDto extends createZodDto(publicationUpdateDto) {}
