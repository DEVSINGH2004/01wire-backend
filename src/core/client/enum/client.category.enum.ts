import { registerEnumType } from '@nestjs/graphql';

export enum ClientCategoryTypeEnum {
  AGRICULTURE = 'AGRICULTURE'
}

registerEnumType(ClientCategoryTypeEnum, { name: 'ClientCategoryTypeEnum' });
