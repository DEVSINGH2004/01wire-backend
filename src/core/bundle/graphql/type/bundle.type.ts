import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BundleTypeEnum } from '../../enum/bundle.type.enum';
import { BundleCategoryEnum } from '../../enum/bundle.category.enum';

@ObjectType('BundleType')
export class BundleType {
  @Field(() => ID)
  id: string;

  @Field(() => [ID])
  publicationIds: string[];

  @Field(() => BundleTypeEnum)
  type: BundleTypeEnum;

  @Field(() => BundleCategoryEnum)
  category: BundleCategoryEnum;

  @Field(() => String)
  traffic: string;

  @Field(() => Int)
  price: number;

  @Field(() => String)
  notes: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
