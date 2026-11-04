import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { RazorpayService } from '../razorpay.service';
import { ShopifyService } from '../../shopify/shopify.service';
import {
  PaymentMethodsType,
  PaymentResultType,
  RazorpayOrderType,
  RazorpayVerifyInput
} from './razorpay.types';

@Resolver()
export class RazorpayResolver {
  constructor(
    private razorpayService: RazorpayService,
    private shopifyService: ShopifyService
  ) {}

  // Which payment options the Payment page may show
  @Query(() => PaymentMethodsType)
  async paymentMethods(): Promise<PaymentMethodsType> {
    return {
      razorpay: this.razorpayService.enabled,
      shopify: this.shopifyService.enabled,
      inrPerCredit: await this.razorpayService.inrPerCredit()
    };
  }

  @Mutation(() => RazorpayOrderType)
  createRazorpayOrder(
    @Args('articleId') articleId: string,
    @Context() { me }: IGraphqlContext
  ) {
    return this.razorpayService.createOrder(articleId, me);
  }

  @Mutation(() => PaymentResultType)
  verifyRazorpayPayment(
    @Args('params') params: RazorpayVerifyInput,
    @Context() { me }: IGraphqlContext
  ) {
    return this.razorpayService.verifyPayment(params, me);
  }

  @Query(() => PaymentResultType)
  razorpayPaymentStatus(
    @Args('articleId') articleId: string,
    @Context() { me }: IGraphqlContext
  ) {
    return this.razorpayService.getStatus(articleId, me);
  }
}
