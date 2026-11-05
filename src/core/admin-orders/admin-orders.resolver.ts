import { Args, Query, Resolver } from '@nestjs/graphql';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { AllowedRoles } from 'src/core/auth/decorator/allowedroles.decorator';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { AdminOrdersService } from './admin-orders.service';
import { AdminOverviewType, AdminPrFilterInput, AdminPrPageType, AdminPrRowType } from './admin-orders.types';

@Resolver()
export class AdminOrdersResolver {
  constructor(private service: AdminOrdersService) {}

  // The admin "PR Orders" list: one row per PR with customer, client, sites, payment, progress
  @Query(() => AdminPrPageType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async adminPrOrders(
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('filterInput', { nullable: true }) filterInput: AdminPrFilterInput
  ) {
    return this.service.list(paginationInput.currentPage, paginationInput.perPage, filterInput || {});
  }

  // The admin "Overview" page: counts of work waiting + the last 7 days (incl. money)
  @Query(() => AdminOverviewType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async adminOverview() {
    return this.service.overview();
  }

  // The same summary for one PR (the PR page)
  @Query(() => AdminPrRowType, { nullable: true })
  @AllowedRoles([UserTypeEnum.ADMIN])
  async adminPrOrder(@Args('articleId') articleId: string) {
    return this.service.one(articleId);
  }
}
