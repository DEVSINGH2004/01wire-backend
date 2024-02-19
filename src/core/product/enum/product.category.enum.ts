import { registerEnumType } from "@nestjs/graphql";

export enum ProductCategoryEnum {
  GENERAL = 'GENERAL'
}

registerEnumType(ProductCategoryEnum, { name: 'ProductCategoryEnum' });
