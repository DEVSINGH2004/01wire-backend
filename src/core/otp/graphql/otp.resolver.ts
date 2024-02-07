import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { OtpService } from '../services/otp.service';
import { OtpVerifyInput } from './input/otp.verify.input';
import { OtpVerifyType } from './type/otp.verify.type';

@Resolver()
export class OtpResolver {
  constructor(private otpService: OtpService) {}

  @Mutation(() => OtpVerifyType)
  async verifyOtp(@Args('params') params: OtpVerifyInput) {
    return this.otpService.verifyOtp(params);
  }
}
