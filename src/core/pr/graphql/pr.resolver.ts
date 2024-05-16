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
import { PrPaginationType } from './type/pr.pagination.type';
import { PublicationType } from 'src/core/publication/graphql/type/publication.type';
import { PublicationService } from 'src/core/publication/services/publication.service';
import { Pr } from '../pr.schema';
import { PrType } from './type/pr.type';
import { PrService } from '../services/pr.service';
import { PrUpdateStatusInput } from './input/pr.update.status.input';
import { PrFilterInput } from './input/pr.filter.input';
import { AllowedRoles } from 'src/core/auth/decorator/allowedroles.decorator';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { ArticleService } from 'src/core/article/services/article.service';
import { ArticleType } from 'src/core/article/graphql/type/article.type';

@Resolver(() => PrType)
export class PrResolver {
  constructor(
    private prService: PrService,
    private publicationService: PublicationService,
    private articleService: ArticleService
  ) {}

  @ResolveField(() => ArticleType)
  async articleInfo(@Parent() pr: Pr) {
    return this.articleService.load(pr.articleId);
  }

  @ResolveField(() => PublicationType)
  async publicationInfo(@Parent() pr: Pr) {
    return this.publicationService.load(pr.publicationId);
  }

  @Query(() => PrPaginationType)
  async filterPrsPaginated(
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('filterInput') filterInput: PrFilterInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.prService.getFilteredPaginated(
      paginationInput,
      filterInput,
      me
    );
  }

  @Query(() => PrType, { nullable: true })
  @AllowedRoles([UserTypeEnum.ADMIN])
  async getPrById(@Args('id') id: string) {
    return this.prService.load(id);
  }

  @Mutation(() => Boolean)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async updatePrStatus(@Args('params') params: PrUpdateStatusInput) {
    return this.prService.updateStatus(params);
  }
}
