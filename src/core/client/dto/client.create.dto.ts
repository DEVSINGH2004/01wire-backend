import { createZodDto } from 'nestjs-zod';
import { clinetDto } from './client.dto';

const clientCreateDto = clinetDto.omit({
  id: true,
  status: true
});

export class ClientCreateDto extends createZodDto(clientCreateDto) {}
