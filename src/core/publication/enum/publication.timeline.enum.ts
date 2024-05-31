import { registerEnumType } from '@nestjs/graphql';

export enum PublicationTimelineEnum {
  D1 = 'D1',
  D2 = 'D2',
  D3 = 'D3',
  D4 = 'D4',
  D5 = 'D5',
  W1 = 'W1',
  W2 = 'W2',
  W3 = 'W3',
  W5 = 'W5'
}

registerEnumType(PublicationTimelineEnum, { name: 'PublicationTimelineEnum' });
