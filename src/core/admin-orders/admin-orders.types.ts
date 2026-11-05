import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { PaginationType } from 'src/common/graphql/type/pagination.type';

// One site or package inside a PR (one order once the PR is paid)
@ObjectType()
export class AdminPrItemType {
  @Field(() => ID, { nullable: true })
  orderId: string; // null for an unpaid draft

  @Field()
  name: string;

  @Field()
  type: string; // Publication | Package

  @Field({ nullable: true })
  status: string; // PENDING | PUBLISHED | REJECTED | null (draft)

  @Field({ nullable: true })
  publishBy: Date;

  @Field({ nullable: true })
  url: string;

  @Field({ nullable: true })
  notes: string;

  @Field(() => Int, { nullable: true })
  credits: number;

  @Field(() => Int)
  refundedCredits: number;

  @Field()
  overdue: boolean;
}

@ObjectType()
export class AdminPrPaymentType {
  @Field()
  method: string; // CREDITS | RAZORPAY | SHOPIFY | UNPAID

  @Field(() => Int, { nullable: true })
  credits: number;

  @Field(() => Int, { nullable: true })
  amount: number; // paise, gateway payments only

  @Field({ nullable: true })
  gatewayRef: string;

  @Field()
  test: boolean;

  @Field({ nullable: true })
  paidAt: Date;

  @Field({ nullable: true })
  issue: string; // payment needs review

  @Field(() => Int)
  refundedCredits: number;
}

// One PR = one purchase by one customer, with everything an admin needs to see
@ObjectType()
export class AdminPrRowType {
  @Field(() => ID)
  articleId: string;

  @Field(() => Int)
  prId: number;

  @Field()
  title: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  notes: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => ID, { nullable: true })
  customerId: string;

  @Field({ nullable: true })
  customerName: string;

  @Field({ nullable: true })
  customerEmail: string;

  @Field({ nullable: true })
  clientName: string;

  @Field(() => [AdminPrItemType])
  items: AdminPrItemType[];

  @Field(() => AdminPrPaymentType)
  payment: AdminPrPaymentType;

  @Field(() => Int)
  liveCount: number;

  @Field(() => Int)
  pendingCount: number;

  @Field(() => Int)
  rejectedCount: number;

  @Field(() => Int)
  overdueCount: number;

  @Field(() => Int)
  totalCount: number;

  // UNPAID | REVIEW | WAITING_CUSTOMER | PUBLISH_SITES | CLOSE_PR | REJECT_PR | DONE
  @Field()
  nextStep: string;
}

@ObjectType()
export class AdminPrCountsType {
  @Field(() => Int) toReview: number;
  @Field(() => Int) waitingOnCustomer: number;
  @Field(() => Int) inProgress: number;
  @Field(() => Int) published: number;
  @Field(() => Int) rejected: number;
  @Field(() => Int) drafts: number;
  @Field(() => Int) all: number;
}

@ObjectType()
export class AdminPrPageType {
  @Field(() => [AdminPrRowType])
  data: AdminPrRowType[];

  @Field(() => PaginationType)
  paginationInfo: PaginationType;

  @Field(() => AdminPrCountsType)
  counts: AdminPrCountsType;
}

@InputType()
export class AdminPrFilterInput {
  // toReview | waitingOnCustomer | inProgress | published | rejected | drafts | all
  @Field({ nullable: true })
  tab?: string;

  // PR number, article title, customer name/email or client name
  @Field({ nullable: true })
  search?: string;

  @Field({ nullable: true })
  startTime?: Date;

  @Field({ nullable: true })
  endTime?: Date;
}
