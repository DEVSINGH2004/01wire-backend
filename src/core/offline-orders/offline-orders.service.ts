import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workbook } from 'exceljs';
import { OfflineOrder } from './offline-order.schema';
import { Publication } from '../publication/publication.schema';
import { OfflineImportResultType, OfflineOrdersFilterInput, OfflineOrdersPageType, OfflineOrderUpdateInput, OfflineTotalsType } from './offline-orders.types';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const URL_RE = /https?:\/\/[^\s<>"']+/gi;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Sheet columns (header text, case-insensitive) -> field
const COLUMNS: Record<string, string> = {
  date: 'date',
  'group name': 'group',
  docs_link: 'docs',
  order: 'orderType',
  payment: 'amount',
  publications: 'item',
  'payment status': 'customerPayment',
  'order status': 'status',
  'delivery date': 'delivered',
  'live link': 'live',
  'we gave order to': 'vendor',
  for: 'vendorCost',
  'provider payment status': 'vendorPayment',
  'provider order status': 'vendorStatus',
  'payment link': 'vendorNote',
  notes: 'notes'
};

type Cell = { text: string; link: string | null; num: number | null; date: Date | null };

// exceljs gives strings, numbers, dates, hyperlinks, rich text or formula results: make them one shape
function cellOf(v: any): Cell {
  if (v === null || v === undefined) return { text: '', link: null, num: null, date: null };
  if (v instanceof Date) return { text: v.toISOString(), link: null, num: null, date: v };
  if (typeof v === 'number') return { text: String(v), link: null, num: v, date: null };
  if (typeof v === 'object') {
    if ('result' in v) return cellOf(v.result);
    if (Array.isArray(v.richText)) return cellOf(v.richText.map((t: any) => t.text).join(''));
    if ('hyperlink' in v || 'text' in v) {
      const inner = cellOf(typeof v.text === 'object' ? v.text : String(v.text ?? ''));
      return { ...inner, link: v.hyperlink || inner.link };
    }
  }
  const s = String(v).trim();
  const n = Number(s.replace(/[₹,\s]/g, ''));
  return { text: s, link: null, num: s !== '' && Number.isFinite(n) ? n : null, date: null };
}

// A sheet date (real date or Excel day number) -> 12:00 UTC of that calendar day
function dayOf(c: Cell): Date | null {
  if (c.date) return new Date(Date.UTC(c.date.getUTCFullYear(), c.date.getUTCMonth(), c.date.getUTCDate(), 12));
  if (c.num !== null && c.num > 20000 && c.num < 80000) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(c.num) * 86400000);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12));
  }
  const p = Date.parse(c.text);
  if (!Number.isNaN(p)) { const d = new Date(p); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12)); }
  return null;
}
const monthOf = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
const dayLabel = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

// Every link in a cell; if there is none, the text is kept as a note (e.g. "Delivered report in PDF.")
function linkAndNote(c: Cell): { link: string | null; links: string[]; note: string | null } {
  const found = [...new Set([...(c.text.match(URL_RE) || []), c.link].filter(Boolean).map((u) => u.replace(/[).,]+$/, '')))];
  return { link: found[0] || null, links: found, note: found.length ? null : c.text.trim() || null };
}
const statusOf = (s: string) => (/not/i.test(s) ? 'NOT_DELIVERED' : /deli?v/i.test(s) ? 'DELIVERED' : null);
const paidOf = (s: string) => (/unpaid|not\s*paid|due/i.test(s) ? 'UNPAID' : /paid/i.test(s) ? 'PAID' : null);
const domainOf = (s: string) => s.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#\s]/)[0];

@Injectable()
export class OfflineOrdersService {
  constructor(
    @InjectModel(OfflineOrder.name) private model: Model<OfflineOrder>,
    @InjectModel(Publication.name) private publicationModel: Model<Publication>
  ) {}

  // ---------- import ----------

  async import(fileBase64: string, dryRun: boolean, importBatch: string | null, adminId: string): Promise<OfflineImportResultType> {
    const buf = Buffer.from((fileBase64 || '').replace(/^data:[^,]*,/, ''), 'base64');
    if (!buf.length) throw new BadRequestException('Choose the Excel file to import');
    if (buf.length > MAX_FILE_BYTES) throw new BadRequestException('The file is larger than 5 MB');
    const wb = new Workbook();
    try {
      await wb.xlsx.load(buf);
    } catch {
      throw new BadRequestException('This is not a readable Excel (.xlsx) file');
    }
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('The file has no sheet');

    // Find the columns by their header names
    const head: Record<string, number> = {};
    ws.getRow(1).eachCell((cell, col) => {
      const key = COLUMNS[cellOf(cell.value).text.trim().toLowerCase()];
      if (key && !head[key]) head[key] = col;
    });
    const missing = ['date', 'group', 'amount', 'item'].filter((k) => !head[k]);
    if (missing.length) {
      const names = Object.entries(COLUMNS).filter(([, v]) => missing.includes(v)).map(([k]) => `"${k}"`);
      throw new BadRequestException(`The sheet is missing these columns: ${names.join(', ')}`);
    }

    const pubs = await this.publicationModel.find({}).select('_id domain').lean();
    const pubByDomain = new Map(pubs.filter((p: any) => p.domain).map((p: any) => [domainOf(p.domain), p._id]));

    const errors: { row: number; reason: string }[] = [];
    const warnings: { row: number; reason: string }[] = [];
    const docs: any[] = [];
    const seen = new Map<string, number[]>();
    let rowsRead = 0;
    ws.eachRow((row, r) => {
      if (r === 1) return;
      const get = (k: string): Cell => cellOf(head[k] ? row.getCell(head[k]).value : null);
      const values = Object.keys(head).map((k) => get(k).text).join('');
      if (!values.trim()) return; // empty row
      rowsRead++;
      const date = dayOf(get('date'));
      const group = get('group').text;
      const amount = get('amount').num;
      const item = get('item').text;
      const problems = [!date && 'no valid date', !group && 'no customer (Group Name)', !(amount > 0) && 'no amount paid', !item && 'no site or package'].filter(Boolean);
      if (problems.length) return errors.push({ row: r, reason: `Not imported: ${problems.join(', ')}` });

      const status = statusOf(get('status').text) || 'NOT_DELIVERED';
      if (!statusOf(get('status').text)) warnings.push({ row: r, reason: `Order status "${get('status').text}" not recognised; saved as Not delivered` });
      const live = linkAndNote(get('live'));
      const docsCell = linkAndNote(get('docs'));
      const vendorPayment = paidOf(get('vendorPayment').text) || 'UNPAID';
      const base = `${monthOf(date)}-${String(date.getUTCDate()).padStart(2, '0')}|${group.toLowerCase()}|${item.toLowerCase()}|${amount}`;
      const rowsWithSame = seen.get(base) || [];
      rowsWithSame.push(r);
      seen.set(base, rowsWithSame);
      if (rowsWithSame.length > 1) warnings.push({ row: r, reason: `Same date, customer, site and amount as row ${rowsWithSame[0]}; imported as a separate order` });
      if (importBatch && monthOf(date) !== importBatch) warnings.push({ row: r, reason: `Dated ${dayLabel(date)}; it will show under ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}` });
      if (status === 'DELIVERED' && !live.link) warnings.push({ row: r, reason: live.note ? `Delivered without a link ("${live.note}")` : 'Delivered without a live link' });
      docs.push({
        orderDate: date,
        customerGroup: group,
        articleLink: docsCell.link,
        articleNote: docsCell.link ? null : docsCell.note,
        orderType: get('orderType').text || null,
        amountPaid: Math.round(amount * 100) / 100,
        item,
        matchedPublicationId: pubByDomain.get(domainOf(item)) || null,
        customerPaymentStatus: paidOf(get('customerPayment').text) || 'PAID',
        status,
        deliveredAt: dayOf(get('delivered')),
        liveLink: live.link,
        liveLinks: live.links,
        liveNote: live.note,
        vendor: get('vendor').text || null,
        vendorCost: Math.round((get('vendorCost').num || 0) * 100) / 100,
        vendorPaymentStatus: vendorPayment,
        vendorOrderStatus: statusOf(get('vendorStatus').text),
        vendorPaymentNote: get('vendorNote').text || null,
        notes: get('notes').text || null,
        sourceRow: r,
        dedupeKey: `${base}|${rowsWithSame.length}`,
        importedBy: adminId
      });
    });
    if (!rowsRead) throw new BadRequestException('The sheet has no orders');

    // The batch is the month most orders fall in (e.g. "2026-10") unless one is given
    const tally = new Map<string, number>();
    docs.forEach((d) => tally.set(monthOf(d.orderDate), (tally.get(monthOf(d.orderDate)) || 0) + 1));
    const batch = importBatch && MONTH_RE.test(importBatch) ? importBatch : [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
    if (!importBatch) {
      docs.filter((d) => monthOf(d.orderDate) !== batch).forEach((d) =>
        warnings.push({ row: d.sourceRow, reason: `Dated ${dayLabel(d.orderDate)}; it will show under ${MONTHS[d.orderDate.getUTCMonth()]} ${d.orderDate.getUTCFullYear()}` })
      );
    }

    // Orders already imported (same date + customer + site + amount + position) are skipped
    const existing = new Set((await this.model.find({ dedupeKey: { $in: docs.map((d) => d.dedupeKey) } }).select('dedupeKey').lean()).map((d: any) => d.dedupeKey));
    const fresh = docs.filter((d) => !existing.has(d.dedupeKey)).map((d) => ({ ...d, importBatch: batch }));
    const months = new Map<string, { count: number; paid: number; vendorCost: number }>();
    fresh.forEach((d) => {
      const m = months.get(monthOf(d.orderDate)) || { count: 0, paid: 0, vendorCost: 0 };
      m.count++; m.paid += d.amountPaid; m.vendorCost += d.vendorCost;
      months.set(monthOf(d.orderDate), m);
    });
    if (!dryRun && fresh.length) await this.model.insertMany(fresh);
    return {
      dryRun,
      importBatch: batch,
      rowsRead,
      toAdd: fresh.length,
      alreadyImported: docs.length - fresh.length,
      errors,
      warnings: warnings.sort((a, b) => a.row - b.row),
      months: [...months.entries()].sort().map(([month, m]) => ({ month, count: m.count, paid: Math.round(m.paid * 100) / 100, vendorCost: Math.round(m.vendorCost * 100) / 100 })),
      paid: Math.round(fresh.reduce((s, d) => s + d.amountPaid, 0) * 100) / 100,
      vendorCost: Math.round(fresh.reduce((s, d) => s + d.vendorCost, 0) * 100) / 100
    };
  }

  // Soft-deletes one import (can be imported again)
  async undoImport(importBatch: string): Promise<number> {
    const r = await this.model.updateMany({ importBatch, deletedAt: null } as any, { $set: { deletedAt: new Date() } });
    return r.modifiedCount;
  }

  // ---------- list / totals ----------

  private monthRange(month: string) {
    if (!MONTH_RE.test(month || '')) throw new BadRequestException('Month must look like 2026-10');
    const [y, m] = month.split('-').map(Number);
    return { $gte: new Date(Date.UTC(y, m - 1, 1)), $lt: new Date(Date.UTC(y, m, 1)) };
  }

  totalsOf(list: any[]): OfflineTotalsType {
    const r2 = (n: number) => Math.round(n * 100) / 100;
    const paid = list.reduce((s, o) => s + (o.amountPaid || 0), 0);
    const cost = list.reduce((s, o) => s + (o.vendorCost || 0), 0);
    const owed = list.filter((o) => o.vendorPaymentStatus === 'UNPAID');
    return {
      count: list.length,
      delivered: list.filter((o) => o.status === 'DELIVERED').length,
      notDelivered: list.filter((o) => o.status !== 'DELIVERED').length,
      paid: r2(paid),
      vendorCost: r2(cost),
      margin: r2(paid - cost),
      owedToVendors: r2(owed.reduce((s, o) => s + (o.vendorCost || 0), 0)),
      owedCount: owed.length
    };
  }

  async monthTotals(month: string): Promise<OfflineTotalsType> {
    return this.totalsOf(await this.model.find({ orderDate: this.monthRange(month) }).lean());
  }

  async list(f: OfflineOrdersFilterInput): Promise<OfflineOrdersPageType> {
    const all: any[] = await this.model.find({ orderDate: this.monthRange(f.month) }).sort({ orderDate: 1, sourceRow: 1 }).lean();
    const needle = (f.search || '').trim().toLowerCase();
    const rows = all.filter(
      (o) =>
        (!f.status || o.status === f.status) &&
        (!f.vendorPaymentStatus || o.vendorPaymentStatus === f.vendorPaymentStatus) &&
        (!f.vendor || o.vendor === f.vendor) &&
        (!f.customerGroup || o.customerGroup === f.customerGroup) &&
        (!needle || [o.customerGroup, o.item, o.vendor, o.notes, (o.liveLinks || []).join(' '), o.vendorPaymentNote].join(' ').toLowerCase().includes(needle))
    );
    return {
      data: rows.map((o) => this.view(o)),
      totals: this.totalsOf(all),
      vendors: [...new Set(all.map((o) => o.vendor).filter(Boolean))].sort() as string[],
      groups: [...new Set(all.map((o) => o.customerGroup).filter(Boolean))].sort() as string[]
    };
  }

  view(o: any) {
    return { ...o, id: o._id, margin: Math.round(((o.amountPaid || 0) - (o.vendorCost || 0)) * 100) / 100 };
  }

  // ---------- edit ----------

  async update(dto: OfflineOrderUpdateInput) {
    const set: Record<string, any> = {};
    if (dto.status !== undefined && dto.status !== null) {
      if (!['DELIVERED', 'NOT_DELIVERED'].includes(dto.status)) throw new BadRequestException('Status must be Delivered or Not delivered');
      set.status = dto.status;
      if (dto.status === 'DELIVERED') set.deliveredAt = new Date();
    }
    if (dto.vendorPaymentStatus !== undefined && dto.vendorPaymentStatus !== null) {
      if (!['PAID', 'UNPAID'].includes(dto.vendorPaymentStatus)) throw new BadRequestException('Vendor paid must be Paid or Unpaid');
      set.vendorPaymentStatus = dto.vendorPaymentStatus;
    }
    if (dto.liveLink !== undefined && dto.liveLink !== null) {
      const v = dto.liveLink.trim();
      if (v && !/^https?:\/\/\S+\.\S+$/i.test(v)) throw new BadRequestException('Enter a full link starting with https://');
      set.liveLink = v || null;
    }
    if (dto.notes !== undefined && dto.notes !== null) set.notes = dto.notes.trim().slice(0, 2000) || null;
    if (!Object.keys(set).length) throw new BadRequestException('Nothing to change');
    const before: any = await this.model.findOne({ _id: dto.id }).lean();
    if (!before) throw new NotFoundException('Order not found');
    if (set.status === 'DELIVERED' && before.deliveredAt) delete set.deliveredAt; // keep the real delivery date
    // A new live link is added to the order's links (first in the list); clearing it clears them all
    if ('liveLink' in set) set.liveLinks = set.liveLink ? [set.liveLink, ...(before.liveLinks || []).filter((l: string) => l !== set.liveLink)] : [];
    const after = await this.model.findOneAndUpdate({ _id: dto.id }, { $set: set }, { new: true }).lean();
    return this.view(after);
  }

}
