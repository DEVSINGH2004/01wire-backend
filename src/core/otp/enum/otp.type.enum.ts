import { registerEnumType } from '@nestjs/graphql';

export enum OtpTypeEnum {
  EMAIL = 'EMAIL'
}

registerEnumType(OtpTypeEnum, { name: 'OtpTypeEnum' });
