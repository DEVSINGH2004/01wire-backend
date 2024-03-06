import { createZodDto } from 'nestjs-zod';
import { bundleCreateDto } from './bundle.create.dto';
import { z } from 'nestjs-zod/z';

const bundleUpdateDto = bundleCreateDto
  .partial()
  .extend({ id: z.string().uuid() });

export class BundleUpdateDto extends createZodDto(bundleUpdateDto) {}
