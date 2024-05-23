import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation
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

@Resolver(() => BundleType)
export class BundleResolver {
  constructor(
    private bundleService: BundleService,
    private publicationService: PublicationService
  ) {}

  @ResolveField(() => [PublicationType])
  async publicationInfo(@Parent() bundle: Bundle) {
    if (!bundle.publicationIds?.length) return [];
    return this.publicationService.loadMany(bundle.publicationIds);
  }

  @Query(() => BundlePaginationType)
  async filterBundlesPaginated(
    @Args('paginationInput') paginationInputDto: PaginationInput
  ) {
    return this.bundleService.getFilteredPaginated(paginationInputDto);
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
  async getBundleById(
    @Args('id') id: string,
  ) {
    return this.bundleService.getById(id);
  }
}
