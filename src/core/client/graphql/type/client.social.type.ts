import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('ClientSocialType')
export class ClientSocialType {
  @Field(() => ID)
  facebook: string;

  @Field(() => ID)
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
