// keyword.resolver.ts
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { KeywordService } from '../services/keyword.service';
import { KeywordCreateInput } from './input/keyword.create.input';
import { KeywordFilterInput } from './input/keyword.filter.input';
import { KeywordUpdateInput } from './input/keyword.update.input';
import { KeywordPaginationType } from './type/keyword.pagination.type';
import { KeywordType } from './type/keyword.type';
import { KeywordJoinInput } from './input/keyword.join.input';

@Resolver(() => KeywordType)
export class KeywordResolver {
  constructor(private keywordService: KeywordService) {}

  @Query(() => KeywordPaginationType)
  async getKeywordsPaginated(
    @Args('paginationInput') paginationInputDto: PaginationInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.keywordService.getPaginated(me.userId, paginationInputDto);
  }

  @Query(() => KeywordType)
  async getKeywordById(
    @Args('id') id: string,
    @Context() { me }: IGraphqlContext
  ) {
    return this.keywordService.getKeywordById(id, me.userId);
  }

  @Mutation(() => KeywordType)
  async createKeyword(
    @Args('params') params: KeywordCreateInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.keywordService.createKeyword({ ...params, userId: me.userId });
  }

  @Mutation(() => KeywordType)
  async joinKeyword(
    @Args('params') params: KeywordJoinInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.keywordService.joinKeyword({ ...params, userId: me.userId });
  }

  @Mutation(() => KeywordType)
  async updateKeyword(
    @Args('params') params: KeywordUpdateInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.keywordService.updateKeyword({
      userId: me.userId,
      ...params
    });
  }

  @Mutation(() => Boolean)
  async deleteKeyword(
    @Args('id')
    id: string,
    @Context()
    { me }: IGraphqlContext
  ): Promise<boolean> {
    return this.keywordService.deleteKeyword(id, me);
  }

  @Query(() => KeywordPaginationType)
  async filterKeywordsPaginated(
    @Args('paginationInput') paginationInputDto: PaginationInput,
    @Args('filters') keywordFilterDto: KeywordFilterInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.keywordService.getFilteredPaginated(
      me.userId,
      paginationInputDto,
      keywordFilterDto
    );
  }
}
