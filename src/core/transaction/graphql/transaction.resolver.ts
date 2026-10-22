import {
  Args,
  Context,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { Transaction } from '../transaction.schema';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { TransactionService } from '../services/transaction.service';
import { TransactionCreateInput } from './input/transaction.create.input';
import { TransactionType } from './type/transaction.type';
import { Logger } from '@nestjs/common';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { TransactionFilterInput } from './input/transaction.filter.input';
import { TransactionFilterType } from './type/transaction.filter.type';

@Resolver(() => TransactionType)
export class TransactionResolver {
  private _logger = new Logger(TransactionResolver.name);

  constructor(private transactionService: TransactionService) {}

  // Which admin made a wallet change is an internal audit detail
  @ResolveField(() => ID, { nullable: true })
  performedBy(
    @Parent() transaction: Transaction,
    @Context() { me }: IGraphqlContext
  ) {
    return me?.user?.type === UserTypeEnum.ADMIN
      ? transaction.performedBy
      : null;
  }

  @Mutation(() => String)
  async createTransaction(
    @Args('params') params: TransactionCreateInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.transactionService.create(params, me.userId);
  }

  @Query(() => TransactionFilterType)
  async filterTransactionsPaginated(
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('filterInput') filterInput: TransactionFilterInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.transactionService.getFilteredPaginated(
      me.userId,
      paginationInput,
      filterInput
    );
  }
}
