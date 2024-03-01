import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { BundlePaginationType } from './type/bundle.pagination.type';
import { BundleService } from '../services/bundle.service';
import { BundleType } from './type/bundle.type';
import { PublicationType } from 'src/core/publication/graphql/type/publication.type';
import { Bundle } from '../bundle.schema';
import { PublicationService } from 'src/core/publication/services/publication.service';

@Resolver(() => BundleType)
export class BundleResolver {
  constructor(
    private bundleService: BundleService,
    private publicationService: PublicationService
  ) {}

  @ResolveField(() => PublicationType)
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
}
