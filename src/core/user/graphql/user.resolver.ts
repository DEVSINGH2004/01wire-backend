import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserService } from '../services/user.service';
import { UserType } from './type/user.type';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';

@Resolver(() => UserType)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => UserType)
  async getMe(@Context() { me }: IGraphqlContext) {
    return this.userService.getUserById(me.userId);
  }

  @Mutation(() => Boolean)
  async resetPassword(
    @Args('password') password: string,
    @Context() { me }: IGraphqlContext
  ) {
    return this.userService.resetPassword({ _id: me.userId, password });
  }
}
