import { createZodDto } from 'nestjs-zod';
import { bundleDto } from './bundle.dto';

const bundleCreateDto = bundleDto.omit({
  id: true,
  status: true
});

export class BundleCreateDto extends createZodDto(bundleCreateDto) {}
