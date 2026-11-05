import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article } from '../article/article.schema';
import { ArticleStatusEnum } from '../article/enum/article.status.enum';
import { Order } from '../order/order.schema';
import { OrderStatusEnum } from '../order/enum/order.status.enum';
import { User } from '../user/user.schema';
import { Client } from '../client/client.schema';
import { Publication } from '../publication/publication.schema';
import { Bundle } from '../bundle/bundle.schema';
import { PaymentOrder, PaymentOrderStatusEnum } from '../payment/razorpay/payment.order.schema';
import { paginateResponse } from 'src/common/utils';
import { AdminPrCountsType, AdminPrFilterInput, AdminPrItemType, AdminPrPageType, AdminPrRowType } from './admin-orders.types';

const S = ArticleStatusEnum;
// Which PR statuses each tab shows ("all" = every paid PR, not drafts)
const TABS: Record<string, string[]> = {
  toReview: [S.SUBMITTED, S.REVIEW],
  waitingOnCustomer: [S.AWAITING_APPROVAL],
  inProgress: [S.SCHEDULED],
  published: [S.PUBLISHED],
  rejected: [S.REJECTED],
  drafts: [S.DRAFT],
  all: [S.SUBMITTED, S.REVIEW, S.AWAITING_APPROVAL, S.SCHEDULED, S.PUBLISHED, S.REJECTED]
};
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Read-only view for the admin "PR Orders" page: who bought which sites for which article
@Injectable()
export class AdminOrdersService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<Article>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Client.name) private clientModel: Model<Client>,
    @InjectModel(Publication.name) private publicationModel: Model<Publication>,
    @InjectModel(Bundle.name) private bundleModel: Model<Bundle>,
    @InjectModel(PaymentOrder.name) private paymentModel: Model<PaymentOrder>
  ) {}

  async list(currentPage = 0, perPage = 10, filter: AdminPrFilterInput = {}): Promise<AdminPrPageType> {
    perPage = Math.min(Math.max(perPage || 10, 1), 100);
    currentPage = Math.max(currentPage || 0, 0);
    const base: Record<string, any> = {};
    if (filter.startTime || filter.endTime) {
      base.createdAt = {};
      if (filter.startTime) base.createdAt.$gte = new Date(filter.startTime);
      if (filter.endTime) base.createdAt.$lte = new Date(filter.endTime);
    }
    const search = (filter.search || '').trim();
    if (search) {
      const re = new RegExp(escape(search), 'i');
      const [users, clients] = await Promise.all([
        this.userModel.find({ $or: [{ email: re }, { fullName: re }] }).select('_id').limit(500).lean(),
        this.clientModel.find({ title: re }).select('_id').limit(500).lean()
      ]);
      const or: Record<string, any>[] = [{ title: re }];
      const n = Number(search.replace(/^#/, ''));
      if (Number.isInteger(n) && n > 0) or.push({ prId: n });
      if (users.length) or.push({ userId: { $in: users.map((u) => u._id) } });
      if (clients.length) or.push({ clientId: { $in: clients.map((c) => c._id) } });
      base.$or = or;
    }
    const tab = TABS[filter.tab] ? filter.tab : 'toReview';
    const q = { ...base, status: { $in: TABS[tab] } };
    // Oldest first where work is waiting; newest first elsewhere
    const sort: Record<string, 1 | -1> = ['toReview', 'inProgress'].includes(tab) ? { updatedAt: 1 } : { updatedAt: -1 };
    const [articles, itemCount, counts] = await Promise.all([
      this.articleModel.find(q).sort(sort).skip(currentPage * perPage).limit(perPage).lean(),
      this.articleModel.countDocuments({ ...q, deletedAt: null }),
      this.counts(base)
    ]);
    const data = await this.rows(articles);
    return { data, counts, ...paginateResponse(itemCount, perPage, currentPage) } as AdminPrPageType;
  }

  async one(articleId: string): Promise<AdminPrRowType> {
    const article = await this.articleModel.findOne({ _id: articleId }).lean();
    if (!article) return null;
    return (await this.rows([article]))[0];
  }

  private async counts(base: Record<string, any>): Promise<AdminPrCountsType> {
    const grouped = await this.articleModel.aggregate([
      { $match: { ...base, deletedAt: null } },
      { $group: { _id: '$status', n: { $sum: 1 } } }
    ]);
    const by = Object.fromEntries(grouped.map((g) => [g._id, g.n]));
    const sum = (list: string[]) => list.reduce((s, st) => s + (by[st] || 0), 0);
    return {
      toReview: sum(TABS.toReview),
      waitingOnCustomer: sum(TABS.waitingOnCustomer),
      inProgress: sum(TABS.inProgress),
      published: sum(TABS.published),
      rejected: sum(TABS.rejected),
      drafts: sum(TABS.drafts),
      all: sum(TABS.all)
    };
  }

  private async rows(articles: any[]): Promise<AdminPrRowType[]> {
    if (!articles.length) return [];
    const ids = articles.map((a) => a._id);
    const [orders, users, clients, payments] = await Promise.all([
      this.orderModel.find({ articleId: { $in: ids } }).lean(),
      this.userModel.find({ _id: { $in: [...new Set(articles.map((a) => a.userId))] } }).lean(),
      this.clientModel.find({ _id: { $in: [...new Set(articles.map((a) => a.clientId))] } }).lean(),
      this.paymentModel.find({ articleId: { $in: ids }, status: PaymentOrderStatusEnum.PAID }).sort({ paidAt: -1 }).lean()
    ]);
    // Names for every site / package involved (orders, or the draft's own picks)
    const pubIds = new Set<string>(), bunIds = new Set<string>();
    orders.forEach((o) => { if (o.publicationId) pubIds.add(o.publicationId); if (o.bundleId) bunIds.add(o.bundleId); });
    articles.forEach((a) => { (a.publicationIds || []).forEach((p) => pubIds.add(p)); (a.bundleIds || []).forEach((b) => bunIds.add(b)); });
    const [pubs, buns] = await Promise.all([
      this.publicationModel.find({ _id: { $in: [...pubIds] } }).select('title variantLabel price').lean(),
      this.bundleModel.find({ _id: { $in: [...bunIds] } }).select('name price').lean()
    ]);
    const P = new Map(pubs.map((p: any) => [p._id, p])), B = new Map(buns.map((b: any) => [b._id, b]));
    const U = new Map(users.map((u: any) => [u._id, u])), C = new Map(clients.map((c: any) => [c._id, c]));
    const pubName = (id: string) => { const p: any = P.get(id); return p ? (p.variantLabel ? `${p.title} (${p.variantLabel})` : p.title) : 'Removed site'; };
    const now = Date.now();

    return articles.map((a) => {
      const own = orders.filter((o) => o.articleId === a._id);
      let items: AdminPrItemType[];
      if (own.length) {
        items = own.map((o: any) => {
          const isPackage = !o.publicationId;
          const pkg: any = o.bundleId ? B.get(o.bundleId) : null;
          return {
            orderId: o._id,
            name: isPackage ? pkg?.name || 'Package' : pubName(o.publicationId) + (pkg ? ` · in ${pkg.name}` : ''),
            type: isPackage ? 'Package' : 'Publication',
            status: o.status,
            publishBy: o.publishBy,
            url: o.url,
            notes: o.notes,
            credits: o.credits ?? (isPackage ? pkg?.price : (P.get(o.publicationId) as any)?.price) ?? null,
            refundedCredits: o.refundedCredits || 0,
            overdue: o.status === OrderStatusEnum.PENDING && !!o.publishBy && new Date(o.publishBy).getTime() < now
          };
        });
      } else {
        items = [
          ...(a.publicationIds || []).map((id) => ({ orderId: null, name: pubName(id), type: 'Publication', status: null, publishBy: null, url: null, notes: null, credits: (P.get(id) as any)?.price ?? null, refundedCredits: 0, overdue: false })),
          ...(a.bundleIds || []).map((id) => ({ orderId: null, name: (B.get(id) as any)?.name || 'Package', type: 'Package', status: null, publishBy: null, url: null, notes: null, credits: (B.get(id) as any)?.price ?? null, refundedCredits: 0, overdue: false }))
        ];
      }
      const live = items.filter((i) => i.status === OrderStatusEnum.PUBLISHED).length;
      const pending = items.filter((i) => i.status === OrderStatusEnum.PENDING).length;
      const rejected = items.filter((i) => i.status === OrderStatusEnum.REJECTED).length;
      const pay: any = payments.find((p) => p.articleId === a._id);
      const flagged: any = payments.find((p) => p.articleId === a._id && p.issue);
      const refunded = items.reduce((s, i) => s + (i.refundedCredits || 0), 0);
      const paidAt = pay?.paidAt || (own.length ? own.reduce((m, o: any) => (o.createdAt < m ? o.createdAt : m), own[0].createdAt) : null);
      const user: any = U.get(a.userId);
      return {
        articleId: a._id,
        prId: a.prId,
        title: a.title,
        status: a.status,
        notes: a.notes,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        customerId: a.userId,
        customerName: user?.fullName || null,
        customerEmail: user?.email || null,
        clientName: (C.get(a.clientId) as any)?.title || null,
        items,
        payment: {
          method: a.status === S.DRAFT ? 'UNPAID' : pay ? pay.provider : 'CREDITS',
          credits: a.totalCredits ?? null,
          amount: pay?.amount ?? null,
          gatewayRef: pay ? pay.gatewayRef || pay.gatewayPaymentId || null : null,
          test: !!pay?.test,
          paidAt,
          issue: flagged?.issue || null,
          refundedCredits: refunded
        },
        liveCount: live,
        pendingCount: pending,
        rejectedCount: rejected,
        overdueCount: items.filter((i) => i.overdue).length,
        totalCount: items.length,
        nextStep: this.nextStep(a.status, live, pending)
      };
    });
  }

  private nextStep(status: string, live: number, pending: number): string {
    switch (status) {
      case S.DRAFT: return 'UNPAID';
      case S.SUBMITTED:
      case S.REVIEW: return 'REVIEW';
      case S.AWAITING_APPROVAL: return 'WAITING_CUSTOMER';
      case S.SCHEDULED: return pending > 0 ? 'PUBLISH_SITES' : live > 0 ? 'CLOSE_PR' : 'REJECT_PR';
      default: return 'DONE';
    }
  }
}
