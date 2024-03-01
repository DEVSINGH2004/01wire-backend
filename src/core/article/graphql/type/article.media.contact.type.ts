import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('ArticleMediaContactType')
export class ArticleMediaContactType {
  @Field(() => String)
  name: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  phone: string;

  @Field(() => String)
  website: string;

  @Field(() => String)
  address: string;

  @Field(() => String)
  state: string;

  @Field(() => String)
  country: string;

  @Field(() => String)
  facebook: string;

  @Field(() => String)
  instagram: string;

  @Field(() => String)
  linkedIn: string;

  @Field(() => String)
  twitter: string;

  @Field(() => String)
  youtube: string;

  @Field(() => String)
  others: string;
}
