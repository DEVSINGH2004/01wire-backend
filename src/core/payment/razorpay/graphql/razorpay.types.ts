import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('PaymentMethodsType')
export class PaymentMethodsType {
  @Field(() => Boolean)
  razorpay: boolean;

  @Field(() => Boolean, { description: 'Shopify checkout is set up' })
  shopify: boolean;

  @Field(() => Float, { description: 'INR charged per credit' })
  inrPerCredit: number;
}

@ObjectType('RazorpayOrderType')
export class RazorpayOrderType {
  @Field(() => String)
  keyId: string;

  @Field(() => String)
  orderId: string;

  @Field(() => Int, { description: 'Amount in paise' })
  amount: number;

  @Field(() => String)
  currency: string;

  @Field(() => Int)
  credits: number;

  @Field(() => Int, { nullable: true })
  prId: number;
}

@ObjectType('PaymentResultType')
export class PaymentResultType {
  @Field(() => String, { description: 'PAID or PENDING' })
  status: string;

  @Field(() => Boolean, { description: 'true when the PR was submitted' })
  submitted: boolean;

  @Field(() => String, { nullable: true })
  message?: string;
}

@InputType('RazorpayVerifyInput')
export class RazorpayVerifyInput {
  @Field(() => String)
  orderId: string;

  @Field(() => String)
  paymentId: string;

  @Field(() => String)
  signature: string;
}
