import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('ArticleMediaContactType')
export class ArticleMediaContactType {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  email: string;

  @Field(() => String, { nullable: true })
  phone: string;

  @Field(() => String, { nullable: true })
  website: string;

  @Field(() => String, { nullable: true })
  address: string;

  @Field(() => String, { nullable: true })
  state: string;

  @Field(() => String, { nullable: true })
  city: string;

  @Field(() => String, { nullable: true })
  country: string;

  @Field(() => String, { nullable: true })
  facebook: string;

  @Field(() => String, { nullable: true })
  instagram: string;

  @Field(() => String, { nullable: true })
  linkedIn: string;

  @Field(() => String, { nullable: true })
  twitter: string;

  @Field(() => String, { nullable: true })
  youtube: string;

  @Field(() => String, { nullable: true })
  others: string;
}
