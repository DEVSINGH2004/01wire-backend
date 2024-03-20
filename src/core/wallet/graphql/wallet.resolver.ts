import {
  Resolver,
  Query,
  Context,
  ResolveField,
  Parent
} from '@nestjs/graphql';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { WalletService } from '../services/wallet.service';
import { WalletType } from './type/wallet.type';
import { WalletDocument } from '../wallet.schema';

@Resolver(() => WalletType)
export class WalletResolver {
  constructor(private walletService: WalletService) {}

  @ResolveField()
  id(@Parent() { _id }: WalletDocument) {
    return _id;
  }

  @Query(() => WalletType)
  async getUserWallet(@Context() { me }: IGraphqlContext) {
    return this.walletService.getByUserId(me.userId);
  }
}
