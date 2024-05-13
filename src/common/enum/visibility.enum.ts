import { registerEnumType } from "@nestjs/graphql";

export enum VisibilityEnum {
  SUPPRESSED = 'SUPPRESSED',
  PUBLISHED = 'PUBLISHED'
}

registerEnumType(VisibilityEnum, { name: 'VisibilityEnum' });

