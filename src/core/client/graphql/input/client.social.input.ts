import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ClientSocialInput {
  @Field(() => String, { nullable: true })
  facebook?: string;

  @Field(() => String, { nullable: true })
  instagram?: string;

  @Field(() => String, { nullable: true })
  linkedIn?: string;

  @Field(() => String, { nullable: true })
  twitter?: string;

  @Field(() => String, { nullable: true })
  youtube?: string;

  @Field(() => String, { nullable: true })
  other?: string;
}
