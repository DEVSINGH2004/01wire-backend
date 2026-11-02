import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Publication } from '../publication.schema';
import { PublicationSettings } from '../publication.settings.schema';
import { Model } from 'mongoose';
import { PaginationInputDto } from 'src/common/dto/pagination.input.dto';
import { validate } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { paginateResponse } from 'src/common/utils';
import { PublicationLoaderService } from './publication.loader.service';
import { PublicationFilterDto } from '../dto/publication.filter.dto';
import {
  PublicationCreateDto,
  publicationListingFields
} from '../dto/publication.create.dto';
import { PublicationUpdateDto } from '../dto/publication.update.dto';
import { IMe } from 'src/common/graphql/interface/context.interface';
import * as assert from 'assert';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';
import { PublicationCategoryEnum } from '../enum/publication.category.enum';
import { PublicationTimelineEnum } from '../enum/publication.timeline.enum';
import {
  PublicationBulkActionEnum,
  PublicationBulkInput,
  PublicationImportInput,
  PublicationImportRowInput,
  PublicationSettingsInput
} from '../graphql/input/publication.admin.input';

const SETTINGS_ID = 'default';
const MAX_IMPORT_ROWS = 2000;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Order "publish by" dates use timeline; derive it from the quoted TAT (slow end of a
// range: "3–5 days" -> 5 days). Unknown or blank TAT -> one week.
export const tatToTimeline = (tat?: string | null): PublicationTimelineEnum => {
  const s = (tat || '').toLowerCase();
  const nums = (s.match(/\d+(\.\d+)?/g) || []).map(Number);
  if (!nums.length) return PublicationTimelineEnum.W1;
  const n = Math.max(...nums);
  const days = /hr|hour/.test(s) ? Math.ceil(n / 24) : /week/.test(s) ? n * 7 : n;
  const byDays: [number, PublicationTimelineEnum][] = [
    [1, PublicationTimelineEnum.D1],
    [2, PublicationTimelineEnum.D2],
    [3, PublicationTimelineEnum.D3],
    [4, PublicationTimelineEnum.D4],
    [5, PublicationTimelineEnum.D5],
    [7, PublicationTimelineEnum.W1],
    [14, PublicationTimelineEnum.W2],
    [21, PublicationTimelineEnum.W3],
    [28, PublicationTimelineEnum.W4]
  ];
  return (byDays.find(([d]) => days <= d) || [0, PublicationTimelineEnum.W5])[1];
};

// Fields that affect the calculated price
const PRICE_FIELDS = ['vendorPriceInr', 'markupPercent', 'gstPercent'];

const importRowDto = z.object({
  title: z.string().trim().min(1).max(200),
  ...publicationListingFields,
  domain: publicationListingFields.domain.unwrap().unwrap(),
  vendorPriceInr: z.coerce.number().positive(),
  da: z.coerce.number().int().min(0).max(100).nullish(),
  dr: z.coerce.number().int().min(0).max(100).nullish(),
  image: z.string().max(500).nullish(),
  linkType: z.string().nullish(),
  visibility: z.nativeEnum(VisibilityEnum).nullish()
});

@Injectable()
export class PublicationService {
  constructor(
    @InjectModel(Publication.name)
    protected model: Model<Publication>,
    @InjectModel(PublicationSettings.name)
    protected settingsModel: Model<PublicationSettings>,
    private loaderService: PublicationLoaderService
  ) {}

  async load(id: string, q: Record<string, any> = null): Promise<Publication> {
    if (!id) return null;
    const loader = await this.loaderService.init(q);
    return loader.load(id);
  }

  async loadMany(
    ids: string[],
    q: Record<string, any> = null
  ): Promise<Publication[]> {
    if (!ids || !ids.length) return [];
    const loader = await this.loaderService.init(q);
    return loader.loadMany(ids);
  }

  async getById(id: string): Promise<Publication> {
    const obj = await this.load(id);
    if (!obj) return null;
    return obj;
  }

  // ---------------- pricing ----------------

  async getSettings(): Promise<PublicationSettings> {
    return this.settingsModel.findOneAndUpdate(
      { _id: SETTINGS_ID },
      { $setOnInsert: { _id: SETTINGS_ID } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  // Credits, rounded up: vendor INR + markup + GST, converted at the USD rate ($1 = 1 credit)
  // Credits for a vendor price, using the current markup / GST / rate settings
  // (also used for bundle packages)
  async priceFromVendor(item: { vendorPriceInr?: number; markupPercent?: number }): Promise<number> {
    return this.calcPrice(item, await this.getSettings());
  }

  private calcPrice(
    pub: { vendorPriceInr?: number; markupPercent?: number; gstPercent?: number },
    s: PublicationSettings
  ): number {
    const markup = pub.markupPercent ?? s.markupPercent;
    const gst = pub.gstPercent ?? s.gstPercent;
    return Math.ceil(
      (pub.vendorPriceInr * (1 + markup / 100) * (1 + gst / 100)) / s.usdInrRate
    );
  }

  async updateSettings(input: PublicationSettingsInput): Promise<PublicationSettings> {
    const dto = validate(
      input,
      z.object({
        markupPercent: z.coerce.number().min(0).max(1000).nullish(),
        gstPercent: z.coerce.number().min(0).max(100).nullish(),
        usdInrRate: z.coerce.number().positive().max(10000).nullish()
      })
    );
    const $set = Object.fromEntries(Object.entries(dto).filter(([, v]) => v != null));
    await this.getSettings();
    const settings = await this.settingsModel.findOneAndUpdate(
      { _id: SETTINGS_ID },
      { $set },
      { new: true }
    );
    await this.repriceAll(settings);
    return settings;
  }

  // Re-price every publication that has a vendor price (after a settings change)
  private async repriceAll(settings: PublicationSettings, ids?: string[]) {
    const q: Record<string, any> = { vendorPriceInr: { $ne: null } };
    if (ids) q._id = { $in: ids };
    const pubs = await this.model
      .find(q)
      .select({ vendorPriceInr: 1, markupPercent: 1, gstPercent: 1, price: 1 })
      .lean();
    const ops = pubs
      .map((p) => ({ p, price: this.calcPrice(p, settings) }))
      .filter(({ p, price }) => p.price !== price)
      .map(({ p, price }) => ({
        updateOne: { filter: { _id: p._id }, update: { $set: { price } } }
      }));
    if (ops.length) await this.model.bulkWrite(ops);
    await Promise.all(pubs.map((p) => this.loaderService.cleanCacheById(p._id)));
    return ops.length;
  }

  // ---------------- queries ----------------

  async getFilteredPaginated(
    paginationDto: PaginationInputDto,
    filterDto: PublicationFilterDto,
    me?: IMe
  ) {
    paginationDto = validate(paginationDto, PaginationInputDto);
    filterDto = validate(filterDto, PublicationFilterDto);
    const { currentPage, perPage } = paginationDto;
    const q = {};

    if (me?.user?.type !== UserTypeEnum.ADMIN) {
      q['visibility'] = VisibilityEnum.PUBLISHED;
    } else {
      if (filterDto?.visibility?.length) {
        q['visibility'] = { $in: filterDto.visibility };
      }
      if (filterDto?.importBatch) q['importBatch'] = filterDto.importBatch;
    }

    if (filterDto?.filterIds?.length) q['_id'] = { $nin: filterDto.filterIds };
    if (filterDto?.title) q['title'] = new RegExp(escapeRegex(filterDto.title), 'i');
    if (filterDto?.search) {
      const re = new RegExp(escapeRegex(filterDto.search), 'i');
      q['$or'] = [{ title: re }, { domain: re }];
    }
    if (filterDto?.section) q['section'] = filterDto.section;
    if (filterDto?.language) q['language'] = filterDto.language;
    if (filterDto?.priceMin != null || filterDto?.priceMax != null) {
      q['price'] = {
        ...(filterDto.priceMin != null && { $gte: filterDto.priceMin }),
        ...(filterDto.priceMax != null && { $lte: filterDto.priceMax })
      };
    }

    const [data, itemCount] = await Promise.all([
      this.model
        .find(q)
        .sort({ domain: 1, price: 1, createdAt: -1 })
        .limit(perPage)
        .skip(currentPage * perPage),
      this.model.countDocuments({ ...q, deletedAt: null })
    ]);
    const { paginationInfo } = paginateResponse(
      itemCount,
      perPage,
      currentPage
    );

    return {
      data,
      paginationInfo
    };
  }

  // Every visible offering, for the Marketplace (grouped into websites on the client)
  async getMarketplaceListings(): Promise<Publication[]> {
    const docs = await this.model
      .find({ visibility: VisibilityEnum.PUBLISHED })
      .sort({ domain: 1, price: 1 })
      .lean();
    // Lean docs have no `id` virtual; PublicationType.id needs it
    return docs.map((d) => ({ ...d, id: d._id })) as unknown as Publication[];
  }

  // ---------------- writes ----------------

  // An offering is unique by domain + variant; legacy publications (no domain) by title
  private async assertUnique(
    dto: { title?: string; domain?: string; variantLabel?: string },
    excludeId?: string
  ) {
    const q: Record<string, any> = dto.domain
      ? { domain: dto.domain, variantLabel: dto.variantLabel || null }
      : { title: dto.title, domain: null };
    if (excludeId) q._id = { $ne: excludeId };
    const isFound = await this.model.countDocuments({ ...q, deletedAt: null });
    assert(
      isFound === 0,
      new BadRequestException(
        dto.domain
          ? `${dto.domain} already has an offering "${dto.variantLabel || 'Standard'}"`
          : `A publication with title ${dto.title} already exists`
      )
    );
  }

  async create(dto: PublicationCreateDto): Promise<Publication> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, PublicationCreateDto);
    await this.assertUnique(dto);
    const doc: Record<string, any> = {
      visibility: VisibilityEnum.SUPPRESSED,
      ...dto
    };
    if (dto.vendorPriceInr != null) {
      doc.price = this.calcPrice(dto, await this.getSettings());
    }
    if (dto.domain && !dto.url) doc.url = `https://${dto.domain}`;
    if (!dto.timeline) doc.timeline = tatToTimeline(dto.tat);
    return this.model.create(doc);
  }

  async update(dto: PublicationUpdateDto): Promise<Publication> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, PublicationUpdateDto);
    const { id, ...needToUpdate } = dto;
    const current = await this.model.findById(id).lean();
    assert(current, new BadRequestException('Publication not found'));

    if (dto.title || dto.domain !== undefined || dto.variantLabel !== undefined) {
      await this.assertUnique(
        {
          title: dto.title ?? current.title,
          domain: dto.domain ?? current.domain,
          variantLabel: dto.variantLabel ?? current.variantLabel
        },
        id
      );
    }
    if (needToUpdate.tat !== undefined && !needToUpdate.timeline) {
      needToUpdate['timeline'] = tatToTimeline(needToUpdate.tat);
    }
    const merged = { ...current, ...needToUpdate };
    if (
      merged.vendorPriceInr != null &&
      PRICE_FIELDS.some((f) => f in needToUpdate)
    ) {
      needToUpdate['price'] = this.calcPrice(merged, await this.getSettings());
    }

    const publicationObj = await this.model.findOneAndUpdate(
      { _id: id },
      { $set: needToUpdate },
      { new: true }
    );
    await this.loaderService.cleanCacheById(id);
    return publicationObj;
  }

  async delete(_id: string) {
    await this.model.softDelete({ _id });
    await this.loaderService.cleanCacheById(_id);
    return true;
  }

  async bulk(input: PublicationBulkInput) {
    const { ids, action, markupPercent } = validate(
      input,
      z.object({
        ids: z.array(z.string().uuid()).min(1).max(MAX_IMPORT_ROWS),
        action: z.nativeEnum(PublicationBulkActionEnum),
        markupPercent: z.coerce.number().min(0).max(1000).nullish()
      })
    );
    const filter = { _id: { $in: ids } };
    let res: { matchedCount?: number; modifiedCount?: number };
    if (action === PublicationBulkActionEnum.PUBLISH) {
      res = await this.model.updateMany(filter, {
        $set: { visibility: VisibilityEnum.PUBLISHED }
      });
    } else if (action === PublicationBulkActionEnum.SUPPRESS) {
      res = await this.model.updateMany(filter, {
        $set: { visibility: VisibilityEnum.SUPPRESSED }
      });
    } else if (action === PublicationBulkActionEnum.DELETE) {
      res = await this.model.softDelete(filter);
    } else {
      res = await this.model.updateMany(filter, {
        $set: { markupPercent: markupPercent ?? null }
      });
      await this.repriceAll(await this.getSettings(), ids);
    }
    await Promise.all(ids.map((id) => this.loaderService.cleanCacheById(id)));
    return { matched: res.matchedCount ?? 0, changed: res.modifiedCount ?? 0 };
  }

  // Upsert offerings from a sheet, matched by domain + variantLabel.
  async importRows(input: PublicationImportInput) {
    const { rows, dryRun } = input;
    assert(
      rows?.length && rows.length <= MAX_IMPORT_ROWS,
      new BadRequestException(`Send between 1 and ${MAX_IMPORT_ROWS} rows`)
    );
    const importBatch = (input.importBatch || `import-${new Date().toISOString()}`).slice(0, 60);
    const settings = await this.getSettings();
    const result = { dryRun, added: 0, updated: 0, unchanged: 0, skipped: [] };
    const seen = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const raw: PublicationImportRowInput = rows[i];
      const parsed = importRowDto.safeParse(raw);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        result.skipped.push({ row: i + 1, domain: raw?.domain || null, reason: `${issue.path.join('.')}: ${issue.message}` });
        continue;
      }
      const r = parsed.data;
      const key = `${r.domain}|${r.variantLabel || ''}`;
      if (seen.has(key)) {
        result.skipped.push({ row: i + 1, domain: r.domain, reason: 'duplicate of an earlier row (same domain and variant)' });
        continue;
      }
      seen.add(key);

      const linkType = r.linkType === 'DO_FOLLOW' || r.linkType === 'NO_FOLLOW' ? r.linkType : null;
      const fields: Record<string, any> = {
        title: r.title,
        domain: r.domain,
        variantLabel: r.variantLabel || null,
        url: `https://${r.domain}`,
        linkType,
        timeline: tatToTimeline(r.tat),
        stats: { da: r.da ?? 0, pa: 0, dr: r.dr ?? 0, ur: 0, traffic: 0 }
      };
      for (const f of ['image', 'description', 'topics', 'sampleUrl', 'tat', 'indexed', 'backlinks', 'language', 'tier', 'section', 'validity', 'niche', 'wordsAllowed', 'disclaimer', 'vendorPriceInr', 'sourceVendor', 'internalNotes']) {
        fields[f] = r[f] ?? (f === 'topics' ? [] : null);
      }

      const existing = await this.model
        .findOne({ domain: r.domain, variantLabel: r.variantLabel || null, deletedAt: null })
        .lean();
      if (existing) {
        // A sheet without logo / description / topics keeps what is already there
        // (e.g. a logo uploaded by an admin)
        for (const f of ['image', 'description', 'topics']) {
          const v = fields[f];
          if (v == null || (Array.isArray(v) && !v.length)) delete fields[f];
        }
        const price = this.calcPrice({ ...existing, vendorPriceInr: r.vendorPriceInr }, settings);
        const changes = Object.fromEntries(
          Object.entries({ ...fields, price }).filter(
            ([k, v]) => JSON.stringify(existing[k] ?? null) !== JSON.stringify(v ?? null)
          )
        );
        if (!Object.keys(changes).length) {
          result.unchanged++;
          continue;
        }
        result.updated++;
        if (!dryRun) {
          await this.model.updateOne({ _id: existing._id }, { $set: changes });
          await this.loaderService.cleanCacheById(existing._id);
        }
      } else {
        result.added++;
        if (!dryRun) {
          const section = (r.section || '').toLowerCase();
          await this.model.create({
            ...fields,
            price: this.calcPrice(r, settings),
            categories: [
              section === 'casino'
                ? PublicationCategoryEnum.CASINO
                : section === 'review'
                ? PublicationCategoryEnum.REVIEW
                : PublicationCategoryEnum.GENERAL
            ],
            visibility: r.visibility || VisibilityEnum.SUPPRESSED,
            importBatch
          });
        }
      }
    }
    return result;
  }
}
