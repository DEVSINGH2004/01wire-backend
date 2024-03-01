import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { PublicationType } from './type/publication.type';
import { PublicationService } from '../services/publication.service';
import { PublicationPaginationType } from './type/publication.pagination.type';
import { PublicationFilterInput } from './input/publication.filter.input';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { PublicationCreateInput } from './input/publication.create.input';
import { PublicationUpdateInput } from './input/publication.update.input';

@Resolver(() => PublicationType)
export class PublicationResolver {
  constructor(private publicationService: PublicationService) {}

  @Query(() => PublicationPaginationType)
  async filterPublicationsPaginated(
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('filterInput') filterInput: PublicationFilterInput
  ) {
    return this.publicationService.getFilteredPaginated(
      paginationInput,
      filterInput
    );
  }

  @Mutation(() => PublicationType)
  async createPublication(
    @Args('params') params: PublicationCreateInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.publicationService.create({ userId: me.userId, ...params });
  }

  @Mutation(() => PublicationType)
  async updatePublication(
    @Args('params') params: PublicationUpdateInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.publicationService.update({ userId: me.userId, ...params });
  }

  @Mutation(() => Boolean)
  async deletePublication(
    @Args('id')
    id: string,
    @Context()
    { me }: IGraphqlContext
  ): Promise<boolean> {
    return this.publicationService.delete(id, me);
    return;
  }
}
