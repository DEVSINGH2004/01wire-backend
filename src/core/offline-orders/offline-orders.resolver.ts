import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { AllowedRoles } from 'src/core/auth/decorator/allowedroles.decorator';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { OfflineOrdersService } from './offline-orders.service';
import { OfflineImportResultType, OfflineOrderCreateInput, OfflineOrdersFilterInput, OfflineOrdersPageType, OfflineOrderType, OfflineOrderUpdateInput } from './offline-orders.types';

// Admin-only: orders taken outside the dashboard (monthly sheet import)
@Resolver()
export class OfflineOrdersResolver {
  constructor(private service: OfflineOrdersService) {}

  @Query(() => OfflineOrdersPageType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async offlineOrders(@Args('filterInput') filterInput: OfflineOrdersFilterInput) {
    return this.service.list(filterInput);
  }

  // Preview (dryRun: true) or apply an .xlsx sent as base64
  @Mutation(() => OfflineImportResultType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async importOfflineOrders(
    @Args('fileBase64') fileBase64: string,
    @Args('dryRun') dryRun: boolean,
    @Args('importBatch', { nullable: true }) importBatch: string,
    @Context() { me }: IGraphqlContext
  ) {
    return this.service.import(fileBase64, dryRun, importBatch || null, me.userId);
  }

  @Mutation(() => OfflineOrderType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async updateOfflineOrder(@Args('params') params: OfflineOrderUpdateInput) {
    return this.service.update(params);
  }

  @Mutation(() => OfflineOrderType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async createOfflineOrder(@Args('params') params: OfflineOrderCreateInput, @Context() { me }: IGraphqlContext) {
    return this.service.create(params, me.userId);
  }

  // Soft delete (can be brought back from the database)
  @Mutation(() => Boolean)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async deleteOfflineOrder(@Args('id') id: string) {
    return this.service.remove(id);
  }

  @Mutation(() => Int)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async undoOfflineImport(@Args('importBatch') importBatch: string) {
    return this.service.undoImport(importBatch);
  }
}
