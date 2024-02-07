import { registerEnumType } from '@nestjs/graphql';
export enum KeywordTypeEnum {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PUBLIC_JOINED = 'PUBLIC_JOINED'
}
registerEnumType(KeywordTypeEnum, { name: 'KeywordTypeEnum' });
