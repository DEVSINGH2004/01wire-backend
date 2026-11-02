import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Bundle } from '../bundle.schema';
import { Model } from 'mongoose';
import { BundleLoaderService } from './bundle.loader.service';
import { PaginationInputDto } from 'src/common/dto/pagination.input.dto';
import { validate } from 'nestjs-zod';
import { paginateResponse } from 'src/common/utils';
import { BundleCreateDto } from '../dto/bundle.create.dto';
import { BundleUpdateDto } from '../dto/bundle.update.dto';
import { IMe } from 'src/common/graphql/interface/context.interface';
import { PublicationService } from 'src/core/publication/services/publication.service';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';
import * as assert from 'assert';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';

@Injectable()
export class BundleService {
  constructor(
    @InjectModel(Bundle.name)
    protected model: Model<Bundle>,
    private loaderService: BundleLoaderService,
    private publicationService: PublicationService
  ) {}

  async load(id: string, q: Record<string, any> = null): Promise<Bundle> {
    if (!id) return null;
    const loader = await this.loaderService.init(q);
    return loader.load(id);
  }

  async loadMany(
    ids: string[],
    q: Record<string, any> = null
  ): Promise<Bundle[]> {
    if (!ids || !ids.length) return [];
    const loader = await this.loaderService.init(q);
    return loader.loadMany(ids);
  }

  async getFilteredPaginated(paginationDto: PaginationInputDto, me?: IMe) {
    paginationDto = validate(paginationDto, PaginationInputDto);
    const { currentPage, perPage } = paginationDto;
    const q = {};
    if (me.user.type !== UserTypeEnum.ADMIN) {
      q['visibility'] = VisibilityEnum.PUBLISHED;
    }

    //generate query
    const [data, itemCount] = await Promise.all([
      this.model
        .find(q)
        // Popular (featured) packages first, in their rank order, then by price
        .sort({ featured: -1, featuredRank: 1, price: 1, _id: 1 })
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

  async create(dto: BundleCreateDto): Promise<Bundle> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, BundleCreateDto);
    const doc: Record<string, any> = { ...dto, publicationIds: dto.publicationIds || [] };
    doc.featuredRank = dto.featured ? dto.featuredRank || 999 : null;

    if (dto.name) {
      // Package: its own media list, priced from the vendor price when given
      const isFound = await this.model.countDocuments({ name: dto.name, deletedAt: null });
      assert(isFound === 0, new BadRequestException(`A package named "${dto.name}" already exists`));
      if (dto.vendorPriceInr) doc.price = await this.publicationService.priceFromVendor(dto);
      doc.maxPrice = doc.price;
      doc.traffic = 0;
      return this.model.create(doc);
    }

    const { publicationIds, category, type } = dto;
    const publicationList = await this.publicationService.loadMany(publicationIds);
    assert(
      !publicationList.includes(null) && publicationList.length === publicationIds.length,
      new BadRequestException('one or few of publication ids are invalid')
    );
    assert(
      !publicationList.some((p) => p.visibility === VisibilityEnum.SUPPRESSED),
      new BadRequestException('one or few of publication are suppressed')
    );
    const isFound = await this.model.countDocuments({ category, type, deletedAt: null });
    assert(isFound === 0, new BadRequestException(`A ${category}:${type} bundle already exists`));

    let traffic = 0;
    let maxPrice = 0;
    publicationList.forEach((p) => {
      traffic += p.stats?.traffic || 0;
      maxPrice += p.price;
    });
    if (dto.vendorPriceInr && !dto.price) doc.price = await this.publicationService.priceFromVendor(dto);
    return this.model.create({ ...doc, maxPrice, traffic });
  }

  async getById(id: string): Promise<Bundle> {
    const obj = await this.load(id);
    if (!obj) return null;
    return obj;
  }

  async update(dto: BundleUpdateDto): Promise<Bundle> {
    // featured false / rank null are real values ("not popular"), keep them
    Object.keys(dto).forEach(
      (key) =>
        (dto[key] === null || dto[key] === '') &&
        !['featured', 'featuredRank'].includes(key) &&
        delete dto[key]
    );
    dto = validate(dto, BundleUpdateDto);
    const { id, ...needToUpdate } = dto;

    const oldObj = await this.load(id);
    assert(!!oldObj, new NotFoundException('Bundle not found'));
    // Marking a live package as Popular (or not) doesn't need it hidden first
    const onlyFeatured = Object.keys(needToUpdate).every((k) =>
      ['featured', 'featuredRank'].includes(k)
    );
    assert(
      onlyFeatured || oldObj.visibility === VisibilityEnum.SUPPRESSED,
      new BadRequestException('Bundle can only be updated in suppressed state')
    );
    if (needToUpdate.featured === false) needToUpdate['featuredRank'] = null;
    // Popular without a rank keeps its old rank, or goes last among the popular ones
    if (needToUpdate.featured === true && !needToUpdate.featuredRank)
      needToUpdate['featuredRank'] = oldObj.featuredRank || 999;
    if (needToUpdate.featuredRank === null && needToUpdate.featured === undefined)
      delete needToUpdate['featuredRank'];

    if (dto?.publicationIds?.length) {
      const publicationList = await this.publicationService.loadMany(
        dto.publicationIds
      );

      assert(
        !publicationList.includes(null) &&
          publicationList.length === dto.publicationIds.length,
        new BadRequestException('one or few of publication ids are invalid')
      );
      let traffic = 0;
      let maxPrice = 0;
      publicationList.forEach((p) => {
        traffic += p.stats?.traffic || 0;
        maxPrice += p.price;
      });
      needToUpdate['traffic'] = traffic;
      needToUpdate['maxPrice'] = maxPrice;
    }

    if (needToUpdate.name && needToUpdate.name !== oldObj.name) {
      const isFound = await this.model.countDocuments({
        name: needToUpdate.name,
        _id: { $ne: id },
        deletedAt: null
      });
      assert(isFound === 0, new BadRequestException(`A package named "${needToUpdate.name}" already exists`));
    }

    // Packages are re-priced whenever the vendor price or markup changes
    const vendorPriceInr = needToUpdate.vendorPriceInr ?? oldObj.vendorPriceInr;
    if (
      vendorPriceInr &&
      (needToUpdate.vendorPriceInr !== undefined || needToUpdate.markupPercent !== undefined)
    ) {
      needToUpdate['price'] = await this.publicationService.priceFromVendor({
        vendorPriceInr,
        markupPercent: needToUpdate.markupPercent ?? oldObj.markupPercent
      });
    }
    if (!(oldObj.publicationIds?.length || dto?.publicationIds?.length) && needToUpdate['price']) {
      needToUpdate['maxPrice'] = needToUpdate['price'];
    }

    const bundleObj = await this.model.findOneAndUpdate(
      { _id: id },
      { $set: needToUpdate },
      { new: true }
    );
    await this.loaderService.cleanCacheById(id);
    return bundleObj;
  }

  async updateVisibility(id: string, visibility: VisibilityEnum) {
    assert(
      visibility !== VisibilityEnum.PRIVATE,
      new BadRequestException('Bundle visibility cannot be PRIVATE')
    );
    const res = await this.model
      .findOneAndUpdate({ _id: id }, { $set: { visibility } }, { new: true })
      .orFail(new NotFoundException('Bundle not found'));
    await this.loaderService.cleanCacheById(id);
    return res;
  }

  async delete(id: string) {
    await this.model.softDelete({ _id: id });
    /* if (res.modifiedCount) {
      this.eventEmitter.emit(EventDomainEnum.KEYWORD, {
        action: EventActionEnum.DELETE,
        data: { keywordId: _id }
      });
    } */
    await this.loaderService.cleanCacheById(id);
    return true;
  }
}
