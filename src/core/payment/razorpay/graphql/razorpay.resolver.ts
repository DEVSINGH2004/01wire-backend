import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { RazorpayService } from '../razorpay.service';
import { ShopifyService } from '../../shopify/shopify.service';
import { ConfigService } from '@nestjs/config';
import { ConfigVariablesType } from 'src/config';
import { PaymentAccessService } from '../../access/payment.access.service';
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
    private shopifyService: ShopifyService,
    private access: PaymentAccessService,
    private configService: ConfigService<ConfigVariablesType>
  ) {}

  // CopperX test environment unless the live API (api.copperx.io) is used
  private get copperxTest() {
    return !String(this.configService.get('copperx', { infer: true })?.baseUrl || '').includes('api.copperx.io');
  }

  // Which payment options the Payment page may show
  // Only gateways this user may use (PAYMENT_ALLOWED_USERS) are offered
  @Query(() => PaymentMethodsType)
  async paymentMethods(@Context() { me }: IGraphqlContext): Promise<PaymentMethodsType> {
    return {
      razorpay: await this.razorpayService.availableFor(me?.userId),
      shopify: await this.shopifyService.availableFor(me?.userId),
      razorpayTest: this.razorpayService.testMode,
      shopifyTest: this.shopifyService.enabled ? await this.shopifyService.testMode() : false,
      creditPacks: await this.access.canPay(me?.userId, this.copperxTest),
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
