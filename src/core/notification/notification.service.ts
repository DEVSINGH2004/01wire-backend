import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigVariablesType } from 'src/config';
import { EmailService } from '../services/email.service';
import { ARTICLE_SUBMITTED_EVENT, PR_STATUS_CHANGED_EVENT, SITE_REJECTED_EVENT } from '../article/article.events';
import { Order } from '../order/order.schema';
import { CREDITS_PURCHASED_EVENT } from './notification.events';
import { Article } from '../article/article.schema';
import { ArticleStatusEnum } from '../article/enum/article.status.enum';
import { Publication } from '../publication/publication.schema';
import { Bundle } from '../bundle/bundle.schema';
import { User } from '../user/user.schema';
import { UserTypeEnum } from '../user/enum/user.type.enum';
import { Wallet } from '../wallet/wallet.schema';
import { PaymentOrder, PaymentOrderStatusEnum } from '../payment/razorpay/payment.order.schema';
import { Cart, EmailLog } from './notification.schema';

const MAX_REMINDERS = 2;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // never remind about anything untouched for over a week
const MAX_ITEMS = 300;

const inr = (paise: number) =>
  '₹' + (Number(paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const istDate = (d: Date) =>
  new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';

type Item = { name: string; type: string; credits: number };

// Receipts after a purchase and reminders for an abandoned cart or an unpaid draft PR.
// Every email goes to the account's own email address.
@Injectable()
export class NotificationService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly _logger = new Logger(NotificationService.name);
  private timer: NodeJS.Timeout = null;
  private running = false;

  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(EmailLog.name) private logModel: Model<EmailLog>,
    @InjectModel(Article.name) private articleModel: Model<Article>,
    @InjectModel(Publication.name) private publicationModel: Model<Publication>,
    @InjectModel(Bundle.name) private bundleModel: Model<Bundle>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectModel(PaymentOrder.name) private paymentModel: Model<PaymentOrder>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private emailService: EmailService,
    private configService: ConfigService<ConfigVariablesType>
  ) {}

  private get cfg() {
    return this.configService.get('email', { infer: true });
  }

  // ---------- cart (saved from the Marketplace page) ----------

  async saveCart(userId: string, publicationIds: string[] = [], bundleIds: string[] = []): Promise<boolean> {
    const clean = (ids: string[]) => [...new Set((ids || []).filter((x) => typeof x === 'string' && x.length <= 64))];
    const pubs = clean(publicationIds), bundles = clean(bundleIds);
    if (pubs.length > MAX_ITEMS || bundles.length > MAX_ITEMS) throw new BadRequestException('Too many items in the cart');
    const has = pubs.length + bundles.length > 0;
    const now = await this.cartModel.findOne({ _id: userId }).lean();
    const wasEmpty = !now || !(now.publicationIds?.length || now.bundleIds?.length);
    await this.cartModel.updateOne(
      { _id: userId },
      {
        $set: {
          publicationIds: pubs,
          bundleIds: bundles,
          // a new reminder series starts each time an empty cart gets items
          startedAt: has ? (wasEmpty ? new Date() : now?.startedAt || new Date()) : null
        }
      },
      { upsert: true }
    );
    return true;
  }

  // ---------- receipts ----------

  @OnEvent(ARTICLE_SUBMITTED_EVENT, { async: true })
  async onArticleSubmitted(e: { articleId: string; prId: number; userId: string }) {
    // The PR is paid: its media are no longer "left in the cart"
    await this.cartModel
      .updateOne({ _id: e.userId }, { $set: { publicationIds: [], bundleIds: [], startedAt: null } })
      .catch(() => null);
    await this.sendReceipt(e.articleId).catch((err) => this._logger.error(`receipt for PR ${e.prId}: ${err?.message}`));
  }

  async sendReceipt(articleId: string) {
    const article = await this.articleModel.findOne({ _id: articleId }).lean();
    if (!article) return;
    const user = await this.userModel.findOne({ _id: article.userId }).lean();
    if (!user?.email) return;
    const [items, wallet, paid] = await Promise.all([
      this.itemsOf(article.publicationIds, article.bundleIds),
      this.walletModel.findOne({ userId: article.userId }).lean(),
      this.paymentModel
        .findOne({ articleId, status: PaymentOrderStatusEnum.PAID })
        .sort({ paidAt: -1 })
        .lean()
    ]);
    const method = paid
      ? `${paid.provider === 'SHOPIFY' ? 'Shopify order' : 'Razorpay payment'} ${paid.gatewayRef || paid.gatewayPaymentId || ''}`.trim()
      : '01Wire Credits';
    const params = {
      appName: '01 Wire',
      name: user.fullName || 'there',
      prId: article.prId,
      title: article.title,
      date: istDate(new Date()),
      items,
      totalCredits: article.totalCredits,
      method,
      amountPaid: paid ? inr(paid.amount) : null,
      test: !!paid?.test,
      balance: wallet ? String(wallet.balance) : null,
      link: `${this.cfg.appUrl}/releases/${articleId}`
    };
    await this.sendOnce(`receipt:${articleId}`, 'RECEIPT', articleId, user, `01 Wire receipt - PR #${article.prId} (${article.totalCredits} credits)`, 'order.receipt', params);
  }

  @OnEvent(CREDITS_PURCHASED_EVENT, { async: true })
  async onCreditsPurchased(e: { transactionId: string; userId: string; credits: number }) {
    try {
      const user = await this.userModel.findOne({ _id: e.userId }).lean();
      const wallet = await this.walletModel.findOne({ userId: e.userId }).lean();
      if (!user?.email) return;
      await this.sendOnce(`credits:${e.transactionId}`, 'CREDITS_RECEIPT', e.transactionId, user, `01 Wire receipt - ${e.credits} credits added`, 'recharge.acknowledgement', {
        credits: e.credits,
        balance: wallet?.balance ?? ''
      });
    } catch (err) {
      this._logger.error(`credits receipt ${e.transactionId}: ${err?.message}`);
    }
  }

  // ---------- PR status emails ----------

  // Sites / packages of a PR with their order status (for the Accepted and Published emails)
  private async siteRowsOf(articleId: string) {
    const orders: any[] = await this.orderModel.find({ articleId }).lean();
    const pubIds = orders.map((o) => o.publicationId).filter(Boolean);
    const bunIds = orders.map((o) => o.bundleId).filter(Boolean);
    const [pubs, buns]: any[] = await Promise.all([
      pubIds.length ? this.publicationModel.find({ _id: { $in: pubIds } }).select('title variantLabel').lean() : [],
      bunIds.length ? this.bundleModel.find({ _id: { $in: bunIds } }).select('name').lean() : []
    ]);
    const P = new Map(pubs.map((p) => [p._id, p])), B = new Map(buns.map((b) => [b._id, b]));
    return orders.map((o) => {
      const p: any = o.publicationId ? P.get(o.publicationId) : null;
      const b: any = o.bundleId ? B.get(o.bundleId) : null;
      return {
        name: p ? (p.variantLabel ? `${p.title} (${p.variantLabel})` : p.title) : b?.name || 'Package',
        status: o.status,
        url: o.url,
        publishBy: o.publishBy,
        refunded: o.refundedCredits || 0,
        notes: o.notes
      };
    });
  }

  @OnEvent(PR_STATUS_CHANGED_EVENT, { async: true })
  async onPrStatusChanged(e: { articleId: string; status: string; from?: string; notes?: string; refund?: number }) {
    try {
      const a: any = await this.articleModel.findOne({ _id: e.articleId }).lean();
      if (!a) return;
      const user: any = await this.userModel.findOne({ _id: a.userId }).lean();
      if (!user?.email) return;
      const link = `${this.cfg.appUrl}/releases/${a._id}`;
      const day = (d: Date) => (d ? new Date(d).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }) : '');
      const base = { name: user.fullName || 'there', prId: a.prId, title: a.title, link, buttonText: 'View your PR', color: '#344767' };
      let id = `status:${a._id}:${e.status}`;
      let subject: string;
      let p: Record<string, any>;
      switch (e.status) {
        case 'REVIEW':
          subject = `Your PR #${a.prId} is under review`;
          p = { headline: 'Your press release is under review', intro: "Our team has started checking it. We'll email you when it's accepted, or if anything needs to change." };
          break;
        case 'AWAITING_APPROVAL':
          id += `:${new Date(a.updatedAt).getTime()}`; // can happen more than once
          subject = `Please update your PR #${a.prId}`;
          p = { headline: 'A few changes are needed', intro: 'Before we can publish your press release, please make the change below and send it again. There is nothing more to pay.', messageLabel: 'What to change', message: e.notes || '', buttonText: 'Edit your PR', color: '#b26a00' };
          break;
        case 'RESUBMITTED':
          id += `:${new Date(a.updatedAt).getTime()}`;
          subject = `We got your updated PR #${a.prId}`;
          p = { headline: 'Thanks, we got your update', intro: "Our team will review your updated press release and email you when it's accepted." };
          break;
        case 'SCHEDULED': {
          const sites = (await this.siteRowsOf(a._id)).filter((s) => s.status === 'PENDING');
          subject = `Your PR #${a.prId} is accepted`;
          p = {
            headline: 'Your press release is accepted',
            intro: "We're now placing it on the sites below. We'll email you all the live links when it's published.",
            col1: 'Site / package', col2: 'Expected by',
            rows: sites.map((s) => ({ name: s.name, detail: day(s.publishBy) })),
            color: '#1b5e20'
          };
          break;
        }
        case 'PUBLISHED': {
          const sites = await this.siteRowsOf(a._id);
          const live = sites.filter((s) => s.status === 'PUBLISHED');
          const rejected = sites.filter((s) => s.status === 'REJECTED');
          const back = rejected.reduce((s, r) => s + r.refunded, 0);
          subject = `Your PR #${a.prId} is published`;
          p = {
            headline: `Your press release is live on ${live.length} ${live.length === 1 ? 'site' : 'sites'}`,
            intro: 'Here are the links where it is published.',
            col1: 'Site / package', col2: 'Live link',
            rows: [...live.map((s) => ({ name: s.name, url: s.url })), ...rejected.map((s) => ({ name: s.name, detail: `Not published${s.refunded ? ` · ${s.refunded} credits refunded` : ''}` }))],
            refundLine: back ? `${back} credits for sites that could not publish were already returned to your wallet.` : '',
            color: '#1b5e20'
          };
          break;
        }
        case 'REJECTED':
          subject = `Your PR #${a.prId} was not accepted`;
          p = {
            headline: "We couldn't accept this press release",
            intro: 'Unfortunately it could not be published. The reason is below.',
            messageLabel: 'Reason', message: e.notes || '',
            refundLine: e.refund ? `${e.refund} credits are back in your wallet.` : '',
            color: '#b71c1c'
          };
          break;
        default:
          return;
      }
      await this.sendOnce(id, 'STATUS', a._id, user, subject, 'status.update', { ...base, ...p });
    } catch (err) {
      this._logger.error(`status email for ${e.articleId} (${e.status}): ${err?.message}`);
    }
  }

  @OnEvent(SITE_REJECTED_EVENT, { async: true })
  async onSiteRejected(e: { orderId: string; articleId: string; refund: number; notes: string }) {
    try {
      const a: any = await this.articleModel.findOne({ _id: e.articleId }).lean();
      const o: any = await this.orderModel.findOne({ _id: e.orderId }).lean();
      if (!a || !o) return;
      const user: any = await this.userModel.findOne({ _id: a.userId }).lean();
      if (!user?.email) return;
      const site = o.publicationId
        ? ((p: any) => (p ? (p.variantLabel ? `${p.title} (${p.variantLabel})` : p.title) : 'A site'))(await this.publicationModel.findOne({ _id: o.publicationId }).lean())
        : (await this.bundleModel.findOne({ _id: o.bundleId }).lean() as any)?.name || 'A package';
      await this.sendOnce(`site:${o._id}:REJECTED`, 'STATUS', a._id, user, `${site} couldn't publish your PR #${a.prId}`, 'status.update', {
        name: user.fullName || 'there', prId: a.prId, title: a.title,
        link: `${this.cfg.appUrl}/releases/${a._id}`, buttonText: 'View your PR', color: '#b71c1c',
        headline: `${site} couldn't publish your press release`,
        intro: 'The rest of your PR goes ahead as planned. The reason is below.',
        messageLabel: 'Reason', message: e.notes || '',
        refundLine: e.refund ? `${e.refund} credits for this site are back in your wallet.` : ''
      });
    } catch (err) {
      this._logger.error(`site-rejected email for ${e.orderId}: ${err?.message}`);
    }
  }

  // ---------- reminders ----------

  onApplicationBootstrap() {
    if (!this.cfg.reminders) {
      this._logger.log('Reminder emails are off (EMAIL_REMINDERS not set)');
      return;
    }
    const every = this.cfg.reminderCheckMinutes * 60 * 1000;
    this._logger.log(`Reminder emails on for "${this.cfg.reminders}": after ${this.cfg.reminderDelayMinutes} min, checked every ${this.cfg.reminderCheckMinutes} min`);
    this.timer = setInterval(() => this.runReminders(), every);
    setTimeout(() => this.runReminders(), 30 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private remindable(user: any): boolean {
    if (!user?.email || user.isBlocked || user.emailReminders === false) return false;
    const list = this.cfg.reminders;
    if (list === '*') return user.type === UserTypeEnum.USER;
    return list.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean).includes(String(user.email).toLowerCase());
  }

  // How many reminders were sent for this thing, and whether the next one is due
  private async nextReminder(kind: string, refId: string, now: number) {
    const sent = await this.logModel.find({ kind, refId }).sort({ createdAt: -1 }).lean();
    if (sent.length >= MAX_REMINDERS) return 0;
    // the second reminder comes 3 delays after the first (3 days with the 24 h default)
    if (sent.length && now - new Date(sent[0].createdAt).getTime() < 3 * this.cfg.reminderDelayMinutes * 60 * 1000) return 0;
    return sent.length + 1;
  }

  // At most one reminder email per person per delay window (24 h by default)
  private async remindedRecently(userId: string, now: number) {
    const since = new Date(now - this.cfg.reminderDelayMinutes * 60 * 1000);
    return !!(await this.logModel.exists({ userId, kind: { $in: ['DRAFT_REMINDER', 'CART_REMINDER'] }, createdAt: { $gt: since } }));
  }

  async runReminders() {
    if (this.running || !this.cfg.reminders) return;
    this.running = true;
    try {
      const now = Date.now();
      const due = new Date(now - this.cfg.reminderDelayMinutes * 60 * 1000);
      const oldest = new Date(now - MAX_AGE_MS);
      const remindedUsers = new Set<string>();
      const seenDraftUsers = new Set<string>();
      const newestDraftAt = new Map<string, number>();

      // 1) Draft PRs with media that were never paid - only each person's newest one
      const drafts = await this.articleModel
        .find({
          status: ArticleStatusEnum.DRAFT,
          updatedAt: { $gte: oldest },
          $or: [{ 'publicationIds.0': { $exists: true } }, { 'bundleIds.0': { $exists: true } }]
        })
        .sort({ updatedAt: -1 })
        .limit(200)
        .lean();
      for (const d of drafts) {
        if (seenDraftUsers.has(d.userId)) continue;
        seenDraftUsers.add(d.userId);
        newestDraftAt.set(d.userId, new Date(d.updatedAt).getTime());
        // Still being worked on: wait, and don't nag about an older draft meanwhile
        if (new Date(d.updatedAt) > due) continue;
        const user = await this.userModel.findOne({ _id: d.userId }).lean();
        if (!this.remindable(user) || (await this.remindedRecently(d.userId, now))) continue;
        const n = await this.nextReminder('DRAFT_REMINDER', d._id, now);
        if (!n) continue;
        const items = await this.itemsOf(d.publicationIds, d.bundleIds);
        if (!items.length) continue;
        const sent = await this.sendOnce(`draft:${d._id}:${n}`, 'DRAFT_REMINDER', d._id, user, `Your press release PR #${d.prId} is ready to publish`, 'draft.reminder', {
          name: user.fullName || 'there',
          prId: d.prId,
          title: d.title,
          items: items.slice(0, 5),
          more: Math.max(0, items.length - 5),
          count: items.length,
          totalCredits: items.reduce((s, i) => s + (i.credits || 0), 0),
          link: `${this.cfg.appUrl}/releases/${d._id}/payment`,
          unsubscribe: this.unsubscribeLink(user._id)
        });
        if (sent) remindedUsers.add(d.userId);
      }

      // 2) Carts with items and no purchase since
      const carts = await this.cartModel
        .find({
          updatedAt: { $lte: due, $gte: oldest },
          $or: [{ 'publicationIds.0': { $exists: true } }, { 'bundleIds.0': { $exists: true } }]
        })
        .limit(200)
        .lean();
      for (const c of carts) {
        if (remindedUsers.has(c._id)) continue;
        const started = new Date(c.startedAt || c.updatedAt).getTime();
        // The cart was turned into a draft PR after it was filled: the draft reminder covers it
        if ((newestDraftAt.get(c._id) || 0) >= started) continue;
        const user = await this.userModel.findOne({ _id: c._id }).lean();
        if (!this.remindable(user) || (await this.remindedRecently(c._id, now))) continue;
        const series = `${c._id}:${started}`;
        const n = await this.nextReminder('CART_REMINDER', series, now);
        if (!n) continue;
        const items = await this.itemsOf(c.publicationIds, c.bundleIds);
        if (!items.length) continue;
        const sent = await this.sendOnce(`cart:${series}:${n}`, 'CART_REMINDER', series, user, `You left ${items.length} ${items.length === 1 ? 'item' : 'items'} in your 01 Wire cart`, 'cart.reminder', {
          name: user.fullName || 'there',
          items: items.slice(0, 5),
          more: Math.max(0, items.length - 5),
          count: items.length,
          itemWord: items.length === 1 ? 'item' : 'items',
          totalCredits: items.reduce((s, i) => s + (i.credits || 0), 0),
          link: `${this.cfg.appUrl}/marketplace`,
          unsubscribe: this.unsubscribeLink(user._id)
        });
        if (sent) remindedUsers.add(c._id);
      }
      if (remindedUsers.size) this._logger.log(`Sent ${remindedUsers.size} reminder email(s)`);
    } catch (err) {
      this._logger.error(`reminders: ${err?.message}`);
    } finally {
      this.running = false;
    }
  }

  // ---------- unsubscribe ----------

  private sign(userId: string) {
    const secret = this.configService.get('auth.jwtSecret', { infer: true });
    return createHmac('sha256', `${secret}:email-unsubscribe`).update(userId).digest('hex').slice(0, 32);
  }

  unsubscribeLink(userId: string) {
    return `${this.cfg.apiUrl}/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${this.sign(userId)}`;
  }

  async unsubscribe(userId: string, token: string): Promise<boolean> {
    if (!userId || !token) return false;
    const want = Buffer.from(this.sign(userId)), got = Buffer.from(String(token));
    if (want.length !== got.length || !timingSafeEqual(want, got)) return false;
    const r = await this.userModel.updateOne({ _id: userId }, { $set: { emailReminders: false } });
    return r.matchedCount > 0;
  }

  // ---------- helpers ----------

  private async itemsOf(publicationIds: string[] = [], bundleIds: string[] = []): Promise<Item[]> {
    const [pubs, bundles] = await Promise.all([
      publicationIds?.length ? this.publicationModel.find({ _id: { $in: publicationIds } }).lean() : [],
      bundleIds?.length ? this.bundleModel.find({ _id: { $in: bundleIds } }).lean() : []
    ]);
    return [
      ...(pubs as any[]).map((p) => ({ name: p.variantLabel ? `${p.title} (${p.variantLabel})` : p.title, type: 'Publication', credits: p.price })),
      ...(bundles as any[]).map((b) => ({ name: b.name || 'Package', type: 'Package', credits: b.price }))
    ];
  }

  // Claims the email's log row first, so two servers (or a repeated event) never send it twice
  private async sendOnce(id: string, kind: string, refId: string, user: any, subject: string, template: string, params: Record<string, any>): Promise<boolean> {
    const outbox = !!process.env.EMAIL_OUTBOX_DIR && process.env.NODE_ENV !== 'production';
    if (!outbox && /@(example\.(com|org|net)|[^@]+\.(test|invalid|example))$/i.test(user?.email || '')) return false;
    try {
      await this.logModel.create({ _id: id, kind, refId, userId: user._id, to: user.email });
    } catch (e) {
      if (e?.code === 11000) return false; // already sent
      throw e;
    }
    try {
      await this.emailService.sendTemplate(user.email, subject, template, params);
      return true;
    } catch (err) {
      // Kept as failed (not retried) so a broken mail setup cannot send floods later
      await this.logModel.updateOne({ _id: id }, { $set: { failed: true, error: String(err?.message || err).slice(0, 300) } });
      this._logger.warn(`email ${id} to ${user.email} failed: ${err?.message}`);
      return false;
    }
  }
}
