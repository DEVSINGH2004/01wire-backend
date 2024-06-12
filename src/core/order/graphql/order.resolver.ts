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
import { OrderPaginationType } from './type/order.pagination.type';
import { PublicationType } from 'src/core/publication/graphql/type/publication.type';
import { PublicationService } from 'src/core/publication/services/publication.service';
import { Order } from '../order.schema';
import { OrderType } from './type/order.type';
import { OrderService } from '../services/order.service';
import { OrderUpdateStatusInput } from './input/order.update.status.input';
import { OrderFilterInput } from './input/order.filter.input';
import { AllowedRoles } from 'src/core/auth/decorator/allowedroles.decorator';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { ArticleService } from 'src/core/article/services/article.service';
import { ArticleType } from 'src/core/article/graphql/type/article.type';
import { BundleType } from 'src/core/bundle/graphql/type/bundle.type';
import { BundleService } from 'src/core/bundle/services/bundle.service';
import { UserType } from 'src/core/user/graphql/type/user.type';
import { UserService } from 'src/core/user/services/user.service';

@Resolver(() => OrderType)
export class OrderResolver {
  constructor(
    private orderService: OrderService,
    private publicationService: PublicationService,
    private articleService: ArticleService,
    private bundleService: BundleService,
    private userService: UserService
  ) {}

  @ResolveField(() => UserType)
  async user(@Parent() order: Order) {
    return this.userService.load(order.userId);
  }

  @ResolveField(() => ArticleType)
  async articleInfo(@Parent() order: Order) {
    return this.articleService.load(order.articleId);
  }

  @ResolveField(() => PublicationType)
  async publicationInfo(@Parent() order: Order) {
    return this.publicationService.load(order.publicationId);
  }

  @ResolveField(() => BundleType)
  async bundleInfo(@Parent() order: Order) {
    return this.bundleService.load(order.bundleId);
  }

  @Query(() => OrderPaginationType)
  async filterOrdersPaginated(
    @Args('paginationInput') paginationInput: PaginationInput,
    @Args('filterInput') filterInput: OrderFilterInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.orderService.getFilteredPaginated(
      paginationInput,
      filterInput,
      me
    );
  }

  @Query(() => OrderType, { nullable: true })
  @AllowedRoles([UserTypeEnum.ADMIN])
  async getOrderById(@Args('id') id: string) {
    return this.orderService.load(id);
  }

  @Mutation(() => Boolean)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async updateOrderStatus(@Args('params') params: OrderUpdateStatusInput) {
    return this.orderService.updateStatus(params);
  }
}
