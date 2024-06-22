import {
  Resolver,
  Query,
  Args,
  Context,
  ResolveField,
  Parent,
  Mutation
} from '@nestjs/graphql';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { PublicationType } from 'src/core/publication/graphql/type/publication.type';
import { PublicationService } from 'src/core/publication/services/publication.service';
import { AllowedRoles } from 'src/core/auth/decorator/allowedroles.decorator';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { EstimateType } from './type/estimate.type';
import { EstimateService } from '../services/estimate.service';
import { Estimate } from '../estimate.schema';
import { EstimatePaginationType } from './type/estimate.pagination.type';
import { EstimateFilterInput } from './input/estimate.filter.input';
import { EstimateCreateInput } from './input/estimate.create.input';
import { BundleType } from 'src/core/bundle/graphql/type/bundle.type';
import { BundleService } from 'src/core/bundle/services/bundle.service';

@Resolver(() => EstimateType)
export class EstimateResolver {
  constructor(
    private estimateService: EstimateService,
    private publicationService: PublicationService,
    private bundleService: BundleService
  ) {}

  @ResolveField(() => [PublicationType], { nullable: true })
  async publicationInfo(@Parent() estimate: Estimate) {
    return this.publicationService.loadMany(estimate.publicationIds, {
      deletedAt: true
    });
  }

  @ResolveField(() => [BundleType], { nullable: true })
  async bundleInfo(@Parent() estimate: Estimate) {
    if (!estimate.bundleIds?.length) return [];
    return this.bundleService.loadMany(estimate.bundleIds, {
      deletedAt: true
    });
  }

  @Query(() => EstimatePaginationType)
  async filterEstimatesPaginated(
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('filterInput') filterInput: EstimateFilterInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.estimateService.getFilteredPaginated(
      paginationInput,
      filterInput,
      me
    );
  }

  @Query(() => EstimateType, { nullable: true })
  async getEstimateById(@Args('id') id: string) {
    return this.estimateService.load(id);
  }

  @Mutation(() => EstimateType)
  @AllowedRoles([UserTypeEnum.USER])
  async createEstimate(
    @Args('params') params: EstimateCreateInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.estimateService.create({ userId: me.userId, ...params });
  }

  @Mutation(() => Boolean)
  async deleteEstimate(
    @Args('id')
    id: string,
    @Context()
    { me }: IGraphqlContext
  ): Promise<boolean> {
    return this.estimateService.delete(id, me);
  }
}
