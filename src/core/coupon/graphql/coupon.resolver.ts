import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { PaginationInput } from 'src/common/graphql/input/pagination.input';
import { AllowedRoles } from 'src/core/auth/decorator/allowedroles.decorator';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { CouponType } from './type/coupon.type';
import { CouponService } from '../services/coupon.service';
import { CouponPaginationType } from './type/coupon.pagination.type';
import { CouponCreateInput } from './input/coupon.create.input';
import { CouponUpdateInput } from './input/coupon.update.input';

@Resolver(() => CouponType)
export class CouponResolver {
  constructor(private couponService: CouponService) {}

  @Query(() => CouponPaginationType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async filterCouponsPaginated(
    @Args('paginationInput') paginationInput: PaginationInput
  ) {
    return this.couponService.getFilteredPaginated(paginationInput);
  }

  @Mutation(() => CouponType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async createCoupon(@Args('params') params: CouponCreateInput) {
    return this.couponService.create(params);
  }

  @Mutation(() => CouponType)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async updateCoupon(@Args('params') params: CouponUpdateInput) {
    return this.couponService.update(params);
  }
}
