import { Resolver, Query, Args } from '@nestjs/graphql';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { BundlePaginationType } from './type/bundle.pagination.type';
import { BundleService } from '../services/bundle.service';
import { BundleType } from './type/bundle.type';

@Resolver(() => BundleType)
export class BundleResolver {
  constructor(private bundleService: BundleService) {}

  @Query(() => BundlePaginationType)
  async filterBundlesPaginated(
    @Args('paginationInput') paginationInputDto: PaginationInput
  ) {
    return this.bundleService.getFilteredPaginated(paginationInputDto);
  }
}
