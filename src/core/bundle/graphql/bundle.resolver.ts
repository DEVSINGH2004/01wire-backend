import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
  Context,
  Int
} from '@nestjs/graphql';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { BundlePaginationType } from './type/bundle.pagination.type';
import { BundleService } from '../services/bundle.service';
import { BundleType } from './type/bundle.type';
import { PublicationType } from 'src/core/publication/graphql/type/publication.type';
import { Bundle } from '../bundle.schema';
import { PublicationService } from 'src/core/publication/services/publication.service';
import { BundleCreateInput } from './input/bundle.create.input';
import { BundleUpdateInput } from './input/bundle.update.input';
import { AllowedRoles } from 'src/core/auth/decorator/allowedroles.decorator';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';

@Resolver(() => BundleType)
export class BundleResolver {
  constructor(
    private bundleService: BundleService,
    private publicationService: PublicationService
  ) {}

  @ResolveField(() => [PublicationType])
  async publicationInfo(@Parent() bundle: Bundle) {
    if (!bundle.publicationIds?.length) return [];
    return this.publicationService.loadMany(bundle.publicationIds, {
      deletedAt: true
    });
  }

  // Vendor details are for admins only; clients get null
  private adminOnly(me: IGraphqlContext['me'], value: any) {
    return me?.user?.type === UserTypeEnum.ADMIN ? value ?? null : null;
  }

  @ResolveField(() => String, { nullable: true })
  vendor(@Parent() b: Bundle, @Context() { me }: IGraphqlContext) {
    return this.adminOnly(me, b.vendor);
  }

  @ResolveField(() => String, { nullable: true })
  vendorPackageName(@Parent() b: Bundle, @Context() { me }: IGraphqlContext) {
    return this.adminOnly(me, b.vendorPackageName);
  }

  @ResolveField(() => Int, { nullable: true })
  vendorPriceInr(@Parent() b: Bundle, @Context() { me }: IGraphqlContext) {
    return this.adminOnly(me, b.vendorPriceInr);
  }

  @ResolveField(() => Int, { nullable: true })
  markupPercent(@Parent() b: Bundle, @Context() { me }: IGraphqlContext) {
    return this.adminOnly(me, b.markupPercent);
  }

  @ResolveField(() => String, { nullable: true })
  internalNotes(@Parent() b: Bundle, @Context() { me }: IGraphqlContext) {
    return this.adminOnly(me, b.internalNotes);
  }

  @ResolveField(() => String, { nullable: true })
  source(@Parent() b: Bundle, @Context() { me }: IGraphqlContext) {
    return this.adminOnly(me, b.source);
  }

  @ResolveField(() => String, { nullable: true })
  importBatch(@Parent() b: Bundle, @Context() { me }: IGraphqlContext) {
    return this.adminOnly(me, b.importBatch);
  }

  @Query(() => BundlePaginationType)
  async filterBundlesPaginated(
    @Args('paginationInput') paginationInputDto: PaginationInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.bundleService.getFilteredPaginated(paginationInputDto, me);
  }

  @Mutation(() => BundleType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async createBundle(@Args('params') params: BundleCreateInput) {
    return this.bundleService.create(params);
  }

  @Mutation(() => BundleType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async updateBundle(@Args('params') params: BundleUpdateInput) {
    return this.bundleService.update(params);
  }

  @Query(() => BundleType, { nullable: true })
  async getBundleById(@Args('id') id: string) {
    return this.bundleService.getById(id);
  }

  @Mutation(() => BundleType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async updateBundleVisibility(
    @Args('id') id: string,
    @Args('visibility', { type: () => VisibilityEnum })
    visibility: VisibilityEnum
  ) {
    return this.bundleService.updateVisibility(id, visibility);
  }

  @Mutation(() => Boolean)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async deleteBundle(
    @Args('id')
    id: string
  ): Promise<boolean> {
    return this.bundleService.delete(id);
  }
}
