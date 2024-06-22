import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver
} from '@nestjs/graphql';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { BundleType } from 'src/core/bundle/graphql/type/bundle.type';
import { BundleService } from 'src/core/bundle/services/bundle.service';
import { PublicationType } from 'src/core/publication/graphql/type/publication.type';
import { PublicationService } from 'src/core/publication/services/publication.service';
import { UserType } from 'src/core/user/graphql/type/user.type';
import { UserService } from 'src/core/user/services/user.service';
import { Article } from '../article.schema';
import { ArticleService } from '../services/article.service';
import { ArticleCreateInput } from './input/article.create.input';
import { ArticleFilterInput } from './input/article.filter.input';
import { ArticleUpdateInput } from './input/article.update.input';
import { ArticleUpdateStateInput } from './input/article.update.state.input';
import { ArticlePaginationType } from './type/article.pagination.type';
import { ArticleStatsType } from './type/article.stats.type';
import { ArticleType } from './type/article.type';
import { ClientType } from 'src/core/client/graphql/type/client.type';
import { ClientService } from 'src/core/client/services/client.service';

@Resolver(() => ArticleType)
export class ArticleResolver {
  constructor(
    private articleService: ArticleService,
    private publicationService: PublicationService,
    private bundleService: BundleService,
    private userService: UserService,
    private clientService: ClientService
  ) {}

  @ResolveField(() => ClientType)
  async clientInfo(@Parent() article: Article) {
    return this.clientService.load(article.clientId);
  }

  @ResolveField(() => [BundleType], { nullable: true })
  async bundleInfo(@Parent() article: Article) {
    if (!article.bundleIds?.length) return [];
    return this.bundleService.loadMany(article.bundleIds, {
      deletedAt: true
    });
  }

  @ResolveField(() => [PublicationType])
  async publicationInfo(@Parent() article: Article) {
    if (!article.publicationIds?.length) return [];
    return this.publicationService.loadMany(article.publicationIds, {
      deletedAt: true
    });
  }

  @Query(() => ArticlePaginationType)
  async filterArticlesPaginated(
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('filterInput') filterInput: ArticleFilterInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.articleService.getFilteredPaginated(
      paginationInput,
      filterInput,
      me
    );
  }

  @Query(() => ArticleType, { nullable: true })
  async getArticleById(
    @Args('id') id: string,
    @Context() { me }: IGraphqlContext
  ) {
    return this.articleService.getById(id, me);
  }

  @Query(() => [ArticleStatsType], { nullable: true })
  async getArticleStats(@Context() { me }: IGraphqlContext) {
    return this.articleService.getArticleStats(me.userId);
  }

  @ResolveField(() => UserType)
  async user(@Parent() article: Article) {
    return this.userService.load(article.userId);
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

  @Mutation(() => ArticleType)
  async updateArticleStatus(
    @Args('params') params: ArticleUpdateStateInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.articleService.updateStatus(params, me);
  }

  @Mutation(() => Boolean)
  async deleteArticle(
    @Args('id')
    id: string,
    @Context()
    { me }: IGraphqlContext
  ): Promise<boolean> {
    return this.articleService.delete(id, me);
  }
}
