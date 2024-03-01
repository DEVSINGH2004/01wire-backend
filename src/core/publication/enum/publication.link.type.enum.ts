import { registerEnumType } from '@nestjs/graphql';

export enum PublicationLinkTypeEnum {
  DO_FOLLOW = 'DO_FOLLOW',
  NO_FOLLOW = 'NO_FOLLOW'
}

registerEnumType(PublicationLinkTypeEnum, { name: 'PublicationLinkTypeEnum' });
