import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { ClientCategoryEnum } from '../enum/client.category.enum';
import { clientCreateDto } from './client.create.dto';

const filterDto = clientCreateDto
  .pick({
    type: true
  })
  .extend({
    categories: z.array(z.nativeEnum(ClientCategoryEnum))
  })
  .partial();

export class ClientFilterDto extends createZodDto(filterDto) {}
