import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { ProductStatsType } from './product.stats.type';
import { ProductCategoryEnum } from '../../enum/product.category.enum';
import { ProductLinkTypeEnum } from '../../enum/product.link.type.enum';
import { ProductTimelineEnum } from '../../enum/product.timeline.enum';

@ObjectType('ProductType')
export class ProductType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  image: string;

  @Field(() => ProductStatsType)
  stats: ProductStatsType;

  @Field(() => [ProductCategoryEnum])
  categories: ProductCategoryEnum[];

  @Field(() => ProductLinkTypeEnum)
  linkType: ProductLinkTypeEnum;

  @Field(() => String)
  sampleUrl: string;

  @Field(() => ProductTimelineEnum)
  timeline: ProductTimelineEnum;

  @Field(() => Int)
  price: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
