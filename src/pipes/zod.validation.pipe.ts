import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException
} from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema<any>) {}

  transform(value: any, metadata: ArgumentMetadata): any {
    const { metatype } = metadata;

    if (!metatype || !this.schema || !this.toValidate(metatype)) {
      return value;
    }

    try {
      return this.schema.parse(value);
    } catch (error) {
      throw new BadRequestException(error.errors);
    }
  }

  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
