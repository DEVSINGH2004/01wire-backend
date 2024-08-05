import { registerEnumType } from '@nestjs/graphql';

export enum PublicationCategoryEnum {
  GENERAL = 'GENERAL',
  AWARDS = 'AWARDS',
  ORGANIC = 'ORGANIC',
  PRESS_RELEASE = 'PRESS_RELEASE',
  SPONSORED = 'SPONSORED',
  GUEST_POST = 'GUEST_POST',
  LISTICLE = 'LISTICLE',
  REVIEW = 'REVIEW',
  INTERVIEW = 'INTERVIEW',
  CASINO = 'CASINO',
  GAMBLING = 'GAMBLING',
  MINING = 'MINING'
}

registerEnumType(PublicationCategoryEnum, { name: 'PublicationCategoryEnum' });
