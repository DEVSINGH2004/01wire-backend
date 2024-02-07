import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class OtpVerifyInput {
  @Field(() => String)
  token: string;

  @Field(() => String)
  otp: string;
}
