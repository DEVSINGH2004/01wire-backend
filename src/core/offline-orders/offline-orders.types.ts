import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OfflineOrderType {
  @Field(() => ID) id: string;
  @Field() orderDate: Date;
  @Field() customerGroup: string;
  @Field({ nullable: true }) articleLink: string;
  @Field({ nullable: true }) articleNote: string;
  @Field({ nullable: true }) orderType: string;
  @Field(() => Float) amountPaid: number;
  @Field() item: string;
  @Field({ nullable: true }) matchedPublicationId: string;
  @Field() customerPaymentStatus: string;
  @Field() status: string;
  @Field({ nullable: true }) deliveredAt: Date;
  @Field({ nullable: true }) liveLink: string;
  @Field(() => [String]) liveLinks: string[];
  @Field({ nullable: true }) liveNote: string;
  @Field({ nullable: true }) vendor: string;
  @Field(() => Float) vendorCost: number;
  @Field(() => Float) margin: number;
  @Field() vendorPaymentStatus: string;
  @Field({ nullable: true }) vendorOrderStatus: string;
  @Field({ nullable: true }) vendorPaymentNote: string;
  @Field({ nullable: true }) notes: string;
  @Field() importBatch: string;
  @Field(() => Int, { nullable: true }) sourceRow: number;
  @Field() isTest: boolean;
}

@ObjectType()
export class OfflineTotalsType {
  @Field(() => Int) count: number;
  @Field(() => Int) delivered: number;
  @Field(() => Int) notDelivered: number;
  @Field(() => Float) paid: number;
  @Field(() => Float) vendorCost: number;
  @Field(() => Float) margin: number;
  @Field(() => Float) owedToVendors: number;
  @Field(() => Int) owedCount: number;
}

@ObjectType()
export class OfflineOrdersPageType {
  @Field(() => [OfflineOrderType]) data: OfflineOrderType[];
  @Field(() => OfflineTotalsType) totals: OfflineTotalsType; // the whole month (before filters)
  @Field(() => [String]) vendors: string[];
  @Field(() => [String]) groups: string[];
}

@InputType()
export class OfflineOrdersFilterInput {
  @Field() month: string; // "2026-10"
  @Field({ nullable: true }) status?: string; // DELIVERED | NOT_DELIVERED
  @Field({ nullable: true }) vendorPaymentStatus?: string; // PAID | UNPAID
  @Field({ nullable: true }) vendor?: string;
  @Field({ nullable: true }) customerGroup?: string;
  @Field({ nullable: true }) search?: string;
}

@InputType()
export class OfflineOrderUpdateInput {
  @Field(() => ID) id: string;
  @Field({ nullable: true }) status?: string;
  @Field({ nullable: true }) liveLink?: string;
  @Field({ nullable: true }) vendorPaymentStatus?: string;
  @Field({ nullable: true }) notes?: string;
}

// One order added by hand (an order the sheet doesn't have yet, or a test order)
@InputType()
export class OfflineOrderCreateInput {
  @Field() orderDate: string; // "2026-11-07"
  @Field() customerGroup: string;
  @Field() item: string; // site or package
  @Field(() => Float) amountPaid: number;
  @Field({ nullable: true }) articleLink?: string;
  @Field({ nullable: true }) status?: string; // DELIVERED | NOT_DELIVERED (default)
  @Field({ nullable: true }) deliveredAt?: string;
  @Field({ nullable: true }) liveLink?: string;
  @Field({ nullable: true }) vendor?: string;
  @Field(() => Float, { nullable: true }) vendorCost?: number;
  @Field({ nullable: true }) vendorPaymentStatus?: string; // PAID | UNPAID (default)
  @Field({ nullable: true }) notes?: string;
  @Field({ nullable: true }) isTest?: boolean;
}

@ObjectType()
export class OfflineImportIssueType {
  @Field(() => Int) row: number;
  @Field() reason: string;
}

@ObjectType()
export class OfflineImportMonthType {
  @Field() month: string;
  @Field(() => Int) count: number;
  @Field(() => Float) paid: number;
  @Field(() => Float) vendorCost: number;
}

@ObjectType()
export class OfflineImportResultType {
  @Field() dryRun: boolean;
  @Field() importBatch: string;
  @Field(() => Int) rowsRead: number; // non-empty rows
  @Field(() => Int) toAdd: number; // added (apply) or would be added (preview)
  @Field(() => Int) alreadyImported: number;
  @Field(() => [OfflineImportIssueType]) errors: OfflineImportIssueType[];
  @Field(() => [OfflineImportIssueType]) warnings: OfflineImportIssueType[];
  @Field(() => [OfflineImportMonthType]) months: OfflineImportMonthType[];
  @Field(() => Float) paid: number;
  @Field(() => Float) vendorCost: number;
}
