import { registerEnumType } from "@nestjs/graphql";

export enum PublicationCategoryEnum {
  GENERAL = 'GENERAL'
}

registerEnumType(PublicationCategoryEnum, { name: 'PublicationCategoryEnum' });
