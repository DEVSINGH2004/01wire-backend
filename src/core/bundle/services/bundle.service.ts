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

@Injectable()
export class BundleService {
  constructor(
    @InjectModel(Bundle.name)
    protected model: Model<Bundle>,
    private loaderService: BundleLoaderService,
    private publicationService: PublicationService
  ) {}

  async load(id: string): Promise<Bundle> {
    if (!id) return null;
    const loader = await this.loaderService.init();
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

  async getFilteredPaginated(paginationDto: PaginationInputDto) {
    paginationDto = validate(paginationDto, PaginationInputDto);
    let { currentPage, perPage } = paginationDto;
    perPage = perPage <= 50 ? perPage : 50;
    const q = {};

    //generate query
    const [data, itemCount] = await Promise.all([
      this.model
        .find(q)
        .limit(perPage)
        .skip(currentPage * perPage),
      this.model.countDocuments(q)
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
    const { publicationIds, category, type } = dto;
    const publicationList = await this.publicationService.loadMany(
      publicationIds
    );

    assert(
      publicationList.length === publicationIds.length,
      new BadRequestException('one or few of publication ids are invalid')
    );

    const isFound = await this.model.countDocuments({ category, type });
    assert(
      isFound === 0,
      new BadRequestException(`A ${category}:${type} bundle already exists`)
    );

    let traffic = 0;
    let maxPrice = 0;

    publicationList.forEach((p) => {
      traffic += p.stats.traffic;
      maxPrice += p.price;
    });

    return this.model.create({ ...dto, maxPrice, traffic });
  }

  async getById(id: string): Promise<Bundle> {
    const obj = await this.load(id);
    if (!obj) return null;
    return obj;
  }

  async update(dto: BundleUpdateDto): Promise<Bundle> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, BundleUpdateDto);
    const { id, ...needToUpdate } = dto;

    assert(
      dto.visibility !== VisibilityEnum.PRIVATE,
      new BadRequestException('Bundle visibility cannot be PRIVATE')
    );

    const oldObj = await this.load(id);
    assert(!!oldObj, new NotFoundException('Bundle not found'));
    assert(
      oldObj.visibility === VisibilityEnum.SUPPRESSED,
      new BadRequestException('Bundle can only be updated in suppressed state')
    );

    if (dto?.publicationIds?.length) {
      const publicationList = await this.publicationService.loadMany(
        dto.publicationIds
      );

      assert(
        publicationList.length === dto.publicationIds.length,
        new BadRequestException('one or few of publication ids are invalid')
      );
      let traffic = 0;
      let maxPrice = 0;
      publicationList.forEach((p) => {
        traffic += p.stats.traffic;
        maxPrice += p.price;
      });
      needToUpdate['traffic'] = traffic;
      needToUpdate['maxPrice'] = maxPrice;
    }

    //TODO: calculate maxPrice
    const bundleObj = await this.model.findOneAndUpdate(
      { _id: id },
      { $set: needToUpdate },
      { new: true }
    );
    await this.loaderService.cleanCacheById(id);
    return bundleObj;
  }

  async delete(id: string) {
    await this.model.softDelete({ _id: id });
    /* if (res.modifiedCount) {
      this.eventEmitter.emit(EventDomainEnum.KEYWORD, {
        action: EventActionEnum.DELETE,
        data: { keywordId: _id }
      });
    } */
    return true;
  }
}
