import { Resolver, Query, Args } from '@nestjs/graphql';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { PublicationType } from './type/publication.type';
import { PublicationService } from '../services/publication.service';
import { PublicationPaginationType } from './type/publication.pagination.type';

@Resolver(() => PublicationType)
export class PublicationResolver {
  constructor(private PublicationService: PublicationService) {}

  @Query(() => PublicationPaginationType)
  async filterPublicationsPaginated(
    @Args('paginationInput') paginationInputDto: PaginationInput
  ) {
    return this.PublicationService.getFilteredPaginated(paginationInputDto);
  }
}
