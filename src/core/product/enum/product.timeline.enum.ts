import { registerEnumType } from '@nestjs/graphql';

export enum ProductTimelineEnum {
  WEEK_1 = 'WEEK_1',
  WEEK_2 = 'WEEK_2'
}

registerEnumType(ProductTimelineEnum, { name: 'ProductTimelineEnum' });
