import { registerEnumType } from '@nestjs/graphql';

export enum OtpStatusEnum {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED',
  BLOCKED = 'BLOCKED'
}

registerEnumType(OtpStatusEnum, { name: 'OtpStatusEnum' });
