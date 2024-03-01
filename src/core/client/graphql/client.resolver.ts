import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { ClientType } from './type/client.type';
import { ClientPaginationType } from './type/client.pagination.type';
import { ClientService } from '../services/client.service';
import { ClientCreateInput } from './input/client.create.input';
import { ClientUpdateInput } from './input/client.update.input';
import { ClientFilterInput } from './input/client.filter.input';

@Resolver(() => ClientType)
export class ClientResolver {
  constructor(private clientService: ClientService) {}

  @Query(() => ClientPaginationType)
  async filterClientsPaginated(
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('filters') filterInput: ClientFilterInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.clientService.getFilteredPaginated(
      me.userId,
      paginationInput,
      filterInput
    );
  }

  @Query(() => ClientType)
  async getClientById(
    @Args('id') id: string,
    @Context() { me }: IGraphqlContext
  ) {
    return this.clientService.getById(id, me.userId);
  }

  @Mutation(() => ClientType)
  async createClient(
    @Args('params') params: ClientCreateInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.clientService.create({ userId: me.userId, ...params });
  }

  @Mutation(() => ClientType)
  async updateClient(
    @Args('params') params: ClientUpdateInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.clientService.update({ userId: me.userId, ...params });
  }

  @Mutation(() => Boolean)
  async deleteClient(
    @Args('id')
    id: string,
    @Context()
    { me }: IGraphqlContext
  ): Promise<boolean> {
    return this.clientService.delete(id, me);
  }
}
