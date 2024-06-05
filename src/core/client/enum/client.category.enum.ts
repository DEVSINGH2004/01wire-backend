import { registerEnumType } from '@nestjs/graphql';

export enum ClientCategoryEnum {
  AGRICULTURE = 'AGRICULTURE',
  FINANCE = 'FINANCE',
  HEALTHCARE = 'HEALTHCARE',
  EDUCATION = 'EDUCATION',
  MANUFACTURING = 'MANUFACTURING',
  RETAIL = 'RETAIL',
  MARKETING = 'MARKETING',
  GAMING = 'GAMING',
  CASINO = 'CASINO'
}

registerEnumType(ClientCategoryEnum, { name: 'ClientCategoryEnum' });
