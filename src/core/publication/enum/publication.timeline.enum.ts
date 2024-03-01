import { registerEnumType } from '@nestjs/graphql';

export enum PublicationTimelineEnum {
  WEEK_1 = 'WEEK_1',
  WEEK_2 = 'WEEK_2'
}

registerEnumType(PublicationTimelineEnum, { name: 'PublicationTimelineEnum' });
