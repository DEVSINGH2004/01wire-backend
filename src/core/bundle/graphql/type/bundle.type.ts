import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { BundleTypeEnum } from '../../enum/bundle.type.enum';
import { BundleCategoryEnum } from '../../enum/bundle.category.enum';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';

@ObjectType('BundleType')
export class BundleType {
  @Field(() => ID)
  id: string;

  @Field(() => [ID], { nullable: false })
  publicationIds: [string, ...string[]]; // a non empty string

  @Field(() => String, { nullable: true })
  image: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => BundleTypeEnum)
  type: BundleTypeEnum;

  @Field(() => BundleCategoryEnum)
  category: BundleCategoryEnum;

  @Field(() => String, { nullable: true })
  traffic: string;

  @Field(()=>VisibilityEnum)
  visibility: VisibilityEnum


  @Field(() => Int)
  price: number;

  @Field(() => [String])
  notes: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
