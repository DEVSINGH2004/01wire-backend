import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { UserService } from '../services/user.service';
import { UserType } from './type/user.type';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { UserDocument } from '../user.schema';
import { WalletService } from 'src/core/wallet/services/wallet.service';
import { WalletType } from 'src/core/wallet/graphql/type/wallet.type';

@Resolver(() => UserType)
export class UserResolver {
  constructor(
    private userService: UserService,
    private walletService: WalletService
  ) {}

  @ResolveField(() => WalletType)
  async walletInfo(@Parent() user: UserDocument) {
    const { walletId } = user;
    return this.walletService.load(walletId);
  }

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
