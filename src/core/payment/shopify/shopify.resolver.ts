import { Args, Context, Field, Int, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { PaymentResultType } from '../razorpay/graphql/razorpay.types';
import { ShopifyService } from './shopify.service';

@ObjectType('ShopifyCheckoutType')
export class ShopifyCheckoutType {
  @Field(() => String, { description: 'Shopify checkout page for this PR' })
  checkoutUrl: string;

  @Field(() => Int, { description: 'Amount in paise' })
  amount: number;

  @Field(() => String)
  currency: string;

  @Field(() => Int)
  credits: number;

  @Field(() => Int, { nullable: true })
  prId: number;
}

@Resolver()
export class ShopifyResolver {
  constructor(private shopifyService: ShopifyService) {}

  @Mutation(() => ShopifyCheckoutType)
  createShopifyCheckout(@Args('articleId') articleId: string, @Context() { me }: IGraphqlContext) {
    return this.shopifyService.createCheckout(articleId, me);
  }

  // A mutation (not a query) because a paid result adds credits and submits the PR
  @Mutation(() => PaymentResultType)
  checkShopifyPayment(@Args('articleId') articleId: string, @Context() { me }: IGraphqlContext) {
    return this.shopifyService.checkStatus(articleId, me);
  }
}
