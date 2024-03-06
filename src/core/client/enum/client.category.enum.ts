import { registerEnumType } from '@nestjs/graphql';

export enum ClientCategoryEnum {
  AGRICULTURE = 'AGRICULTURE'
}

registerEnumType(ClientCategoryEnum, { name: 'ClientCategoryEnum' });
