import { createZodDto } from 'nestjs-zod';
import { bundleBaseDto } from './bundle.create.dto';
import { z } from 'nestjs-zod/z';

const bundleUpdateDto = bundleBaseDto
  .partial()
  .omit({ visibility: true })
  .extend({ id: z.string().uuid() });

export class BundleUpdateDto extends createZodDto(bundleUpdateDto) {}
