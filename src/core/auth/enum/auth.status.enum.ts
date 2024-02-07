import { registerEnumType } from '@nestjs/graphql';

export enum AuthStatusEnum {
  LOGGED_IN = 'LOGGED_IN',
  NOT_FOUND = 'NOT_FOUND',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED'
}

registerEnumType(AuthStatusEnum, { name: 'AuthStatusEnum' });
