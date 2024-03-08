import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('ClientSocialType')
export class ClientSocialType {
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
