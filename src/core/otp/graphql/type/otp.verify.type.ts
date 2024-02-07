import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('OtpVerifyType')
export class OtpVerifyType {
  @Field(() => String)
  token: string;
}
