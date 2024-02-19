import { Resolver, Query, Args } from '@nestjs/graphql';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { ProductType } from './type/product.type';
import { ProductService } from '../services/product.service';
import { ProductPaginationType } from './type/product.pagination.type';

@Resolver(() => ProductType)
export class ProductResolver {
  constructor(private productService: ProductService) {}

  @Query(() => ProductPaginationType)
  async filterProductsPaginated(
    @Args('paginationInput') paginationInputDto: PaginationInput
  ) {
    return this.productService.getFilteredPaginated(paginationInputDto);
  }
}
