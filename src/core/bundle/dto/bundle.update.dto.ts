import { createZodDto } from 'nestjs-zod';
import { bundleDto } from './bundle.dto';

const bundleUpdateDto = bundleDto.omit({});

export class BundleUpdateDto extends createZodDto(bundleUpdateDto) {}
