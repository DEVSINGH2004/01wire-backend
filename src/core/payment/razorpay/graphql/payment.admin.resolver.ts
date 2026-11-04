import { Args, Context, Field, Float, ID, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { AllowedRoles } from 'src/core/auth/decorator/allowedroles.decorator';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { PaymentOrder } from '../payment.order.schema';

// One gateway payment (Razorpay / Shopify) as admins see it
@ObjectType('PaymentRecordType')
export class PaymentRecordType {
  @Field(() => ID) id: string;
  @Field(() => String) provider: string;
  @Field(() => String) status: string;
  @Field(() => Int, { nullable: true }) prId: number;
  @Field(() => String) articleId: string;
  @Field(() => String) userId: string;
  @Field(() => Int) credits: number;
  @Field(() => Int, { description: 'Amount in paise' }) amount: number;
  @Field(() => String) currency: string;
  @Field(() => Float, { description: 'INR per credit used' }) rate: number;
  @Field(() => String, { nullable: true, description: 'e.g. Shopify order #1008' }) gatewayRef: string;
  @Field(() => String, { nullable: true }) gatewayOrderId: string;
  @Field(() => String, { nullable: true }) gatewayPaymentId: string;
  @Field(() => Boolean) test: boolean;
  @Field(() => Int, { description: 'Refunded on the gateway, paise' }) refundedAmount: number;
  @Field(() => Int) reversedCredits: number;
  @Field(() => String, { nullable: true }) submitError: string;
  @Field(() => String, { nullable: true, description: 'Needs review: reason' }) issue: string;
  @Field(() => Date, { nullable: true }) issueAt: Date;
  @Field(() => Date, { nullable: true }) paidAt: Date;
  @Field(() => Date, { nullable: true }) createdAt: Date;
}

const view = (p: PaymentOrder): PaymentRecordType => ({
  id: p._id,
  provider: p.provider,
  status: p.status,
  prId: p.prId,
  articleId: p.articleId,
  userId: p.userId,
  credits: p.credits,
  amount: p.amount,
  currency: p.currency || 'INR',
  rate: p.rate,
  gatewayRef: p.gatewayRef || null,
  gatewayOrderId: p.gatewayOrderId?.startsWith('pending:') ? null : p.gatewayOrderId,
  gatewayPaymentId: p.gatewayPaymentId || null,
  test: !!p.test,
  refundedAmount: p.refundedAmount || 0,
  reversedCredits: p.reversedCredits || 0,
  submitError: p.submitError || null,
  issue: p.issue || null,
  issueAt: p.issueAt || null,
  paidAt: p.paidAt || null,
  createdAt: p.createdAt || null
});

@Resolver()
export class PaymentAdminResolver {
  constructor(@InjectModel(PaymentOrder.name) private model: Model<PaymentOrder>) {}

  // Gateway payments of one PR (paid ones first). Unpaid / closed checkouts included.
  @Query(() => [PaymentRecordType])
  @AllowedRoles([UserTypeEnum.ADMIN])
  async articlePayments(@Args('articleId') articleId: string): Promise<PaymentRecordType[]> {
    const list = await this.model.find({ articleId }).sort({ paidAt: -1, createdAt: -1 }).limit(50);
    return list.map(view);
  }

  // Payments a person must look at (refund after use, paid twice, amount mismatch...)
  @Query(() => [PaymentRecordType])
  @AllowedRoles([UserTypeEnum.ADMIN])
  async paymentsNeedingReview(): Promise<PaymentRecordType[]> {
    const list = await this.model.find({ issue: { $ne: null } }).sort({ issueAt: -1 }).limit(100);
    return list.map(view);
  }

  @Mutation(() => Boolean)
  @AllowedRoles([UserTypeEnum.ADMIN])
  async markPaymentReviewed(@Args('id', { type: () => ID }) id: string, @Context() { me }: IGraphqlContext): Promise<boolean> {
    const res = await this.model.updateOne({ _id: id, issue: { $ne: null } }, { $set: { issue: null, reviewedBy: me.userId } });
    if (!res.matchedCount) throw new NotFoundException('Nothing to review for this payment');
    return true;
  }
}


