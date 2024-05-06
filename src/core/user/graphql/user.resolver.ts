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
import { UserPaginationType } from './type/user.pagination.type';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { UserFilterInput } from './input/user.filter.input';

@Resolver(() => UserType)
export class UserResolver {
  constructor(
    private userService: UserService,
    private walletService: WalletService
  ) {}

  @Query(() => UserPaginationType)
  async filterUsersPaginated(
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('filterInput') filterInput: UserFilterInput,
  ) {
    return this.userService.getFilteredPaginated(
      paginationInput,
      filterInput,
    );
  }

  @ResolveField(() => WalletType, { nullable: true })
  async walletInfo(@Parent() user: UserDocument) {
    const { walletId } = user;
    if (!walletId) return null;
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
