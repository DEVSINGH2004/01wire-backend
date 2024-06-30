import { registerEnumType } from '@nestjs/graphql';

export enum PublicationCategoryEnum {
  GENERAL = 'GENERAL',
  ORGANIC = 'ORGANIC',
  PRESS_RELEASE = 'PRESS_RELEASE',
  SPONSORED = 'SPONSORED'
}

registerEnumType(PublicationCategoryEnum, { name: 'PublicationCategoryEnum' });
