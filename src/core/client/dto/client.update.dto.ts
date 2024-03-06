import { createZodDto } from 'nestjs-zod';
import { clientCreateDto } from './client.create.dto';
import { z } from 'nestjs-zod/z';

const clientUpdateDto = clientCreateDto
  .partial()
  .extend({ id: z.string().uuid() });

export class ClientUpdateDto extends createZodDto(clientUpdateDto) {}
