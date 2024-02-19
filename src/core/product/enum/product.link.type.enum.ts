import { registerEnumType } from '@nestjs/graphql';

export enum ProductLinkTypeEnum {
  DO_FOLLOW = 'DO_FOLLOW',
  NO_FOLLOW = 'NO_FOLLOW'
}

registerEnumType(ProductLinkTypeEnum, { name: 'ProductLinkTypeEnum' });
