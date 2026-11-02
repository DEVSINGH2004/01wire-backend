import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';

@InputType()
export class PublicationFilterInput {
  @Field(() => [ID], { nullable: true })
  filterIds: string[];

  @Field(() => [VisibilityEnum], { nullable: true })
  visibility: VisibilityEnum[];

  @Field(() => String, { nullable: true })
  title: string;

  // Admin list: matches title or domain
  @Field(() => String, { nullable: true })
  search: string;

  @Field(() => String, { nullable: true })
  section: string;

  @Field(() => String, { nullable: true })
  language: string;

  @Field(() => Int, { nullable: true })
  priceMin: number;

  @Field(() => Int, { nullable: true })
  priceMax: number;

  @Field(() => String, { nullable: true })
  importBatch: string;
}
