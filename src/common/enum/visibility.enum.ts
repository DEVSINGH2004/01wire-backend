import { registerEnumType } from '@nestjs/graphql';

export enum VisibilityEnum {
  SUPPRESSED = 'SUPPRESSED',
  PUBLISHED = 'PUBLISHED',
  PRIVATE = 'PRIVATE'
}

registerEnumType(VisibilityEnum, { name: 'VisibilityEnum' });
