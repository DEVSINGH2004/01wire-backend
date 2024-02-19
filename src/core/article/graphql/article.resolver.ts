import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  ResolveField,
  Parent
} from '@nestjs/graphql';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { ArticleService } from '../services/article.service';
import { ArticleType } from './type/article.type';
import { ArticlePaginationType } from './type/article.pagination.type';
import { ArticleFilterDto } from '../dto/article.filter.dto';
import { ArticleCreateInput } from './input/article.create.input';
import { ArticleUpdateInput } from './input/article.update.input';
import { ArticleFilterInput } from './input/article.filter.input';

@Resolver(() => ArticleType)
export class ArticleResolver {
  constructor(private articleService: ArticleService) {}

  @Query(() => ArticlePaginationType)
  async filterArticlesPaginated(
    @Args('paginationInput') paginationInputDto: PaginationInput,
    @Args('filters') articleFilterDto: ArticleFilterInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.articleService.getFilteredPaginated(
      me.userId,
      paginationInputDto,
      articleFilterDto
    );
  }

  @Query(() => ArticleType)
  async getArticleById(
    @Args('id') id: string,
    @Context() { me }: IGraphqlContext
  ) {
    return this.articleService.getById(id, me.userId);
  }

  @Mutation(() => ArticleType)
  async createArticle(
    @Args('params') params: ArticleCreateInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.articleService.create({ userId: me.userId, ...params });
  }

  @Mutation(() => ArticleType)
  async updateArticle(
    @Args('params') params: ArticleUpdateInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.articleService.update({ userId: me.userId, ...params });
  }

  @Mutation(() => Boolean)
  async deleteArticle(
    @Args('id')
    id: string,
    @Context()
    { me }: IGraphqlContext
  ): Promise<boolean> {
    return this.articleService.delete(id, me);
    return;
  }
}
