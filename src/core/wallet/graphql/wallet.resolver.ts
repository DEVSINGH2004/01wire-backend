import {
  Resolver,
  Query,
  Context,
  ResolveField,
  Parent,
  Mutation,
  Args,
  Int,
  ID
} from '@nestjs/graphql';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { WalletService } from '../services/wallet.service';
import { WalletType } from './type/wallet.type';
import { WalletDocument } from '../wallet.schema';
import { AllowedRoles } from 'src/core/auth/decorator/allowedroles.decorator';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';

@Resolver(() => WalletType)
export class WalletResolver {
  constructor(private walletService: WalletService) {}

  @ResolveField()
  id(@Parent() { _id }: WalletDocument) {
    return _id;
  }

  @Query(() => WalletType, { nullable: true })
  async getUserWallet(@Context() { me }: IGraphqlContext) {
    return this.walletService.getByUserId(me.userId);
  }

  @Mutation(() => Boolean)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async updateWalletBalance(
    @Args('amount', { type: () => Int })
    amount: number,
    @Args('notes')
    notes: string,
    @Args('userId', { type: () => ID })
    userId: string
  ): Promise<boolean> {
    return this.walletService.updateBalanceAndCreateTransaction({
      amount,
      notes,
      userId
    });
  }
}
