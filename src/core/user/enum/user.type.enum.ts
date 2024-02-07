import { registerEnumType } from '@nestjs/graphql';

export enum UserTypeEnum {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

registerEnumType(UserTypeEnum, { name: 'UserTypeEnum' });
