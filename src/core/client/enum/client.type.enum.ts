import { registerEnumType } from '@nestjs/graphql';

export enum ClientTypeEnum {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE'
}

registerEnumType(ClientTypeEnum, { name: 'ClientTypeEnum' });
