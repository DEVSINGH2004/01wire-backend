import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from '../services/auth.service';
import { AuthStatusType } from './type/auth.status.type';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Query(() => AuthStatusType)
  async getAuthStatus(@Args('email') email: string) {
    return this.authService.getAuthStatus(email);
  }

  @Mutation(() => AuthStatusType)
  async login(
    @Args('email') email: string,
    @Args('password') password: string
  ) {
    return this.authService.login({ email, password });
  }

  @Mutation(() => AuthStatusType)
  async loginViaOtp(@Args('email') email: string) {
    return this.authService.loginViaOtp(email);
  }

  @Mutation(() => AuthStatusType)
  async signup(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('fullName') fullName: string
  ) {
    return this.authService.signup({
      email,
      password,
      fullName
    });
  }
}
