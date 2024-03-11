import { registerEnumType } from '@nestjs/graphql';

export enum ClientCategoryEnum {
  AGRICULTURE = 'AGRICULTURE',
  FINANCE = 'FINANCE',
  HEALTHCARE = 'HEALTHCARE',
  EDUCATION = 'EDUCATION',
  MANUFACTURING = 'MANUFACTURING',
  RETAIL = 'RETAIL',
  MARKETING = 'MARKETING'
}

registerEnumType(ClientCategoryEnum, { name: 'ClientCategoryEnum' });
