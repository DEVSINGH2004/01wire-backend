import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EstimateLoaderService } from './estimate.loader.service';
import { Model } from 'mongoose';
import { paginateResponse } from 'src/common/utils';
import { PaginationInputDto } from 'src/common/dto/pagination.input.dto';
import { validate } from 'nestjs-zod';
import { IMe } from 'src/common/graphql/interface/context.interface';
import { PublicationService } from 'src/core/publication/services/publication.service';
import { Estimate } from '../estimate.schema';
import { EstimateFilterDto } from '../dto/estimate.filter.dto';
import { EstimateCreateDto } from '../dto/estimate.create.bulk.dto';
import { BundleService } from 'src/core/bundle/services/bundle.service';
import * as assert from 'assert';

@Injectable()
export class EstimateService {
  constructor(
    @InjectModel(Estimate.name)
    protected model: Model<Estimate>,
    private loaderService: EstimateLoaderService,
    private publicationService: PublicationService,
    private bundleService: BundleService
  ) {}

  async load(id: string, q: Record<string, any> = null): Promise<Estimate> {
    if (!id) return null;
    const loader = await this.loaderService.init(q);
    return loader.load(id);
  }

  async loadMany(
    ids: string[],
    q: Record<string, any> = null
  ): Promise<Estimate[]> {
    if (!ids || !ids.length) return [];
    const loader = await this.loaderService.init(q);
    return loader.loadMany(ids);
  }

  private async _validateOwnership(
    _id: string,
    userId: string
  ): Promise<Estimate> {
    const obj = await this.load(_id);
    assert(!!obj, new NotFoundException('estimate not found'));
    assert(
      obj.userId === userId,
      new BadRequestException('invalid estimate ownership')
    );
    return obj;
  }

  async getFilteredPaginated(
    paginationDto: PaginationInputDto,
    filterDto: EstimateFilterDto,
    me?: IMe
  ) {
    paginationDto = validate(paginationDto, PaginationInputDto);
    filterDto = validate(filterDto, EstimateFilterDto);
    let { currentPage, perPage } = paginationDto;
    perPage = perPage <= 50 ? perPage : 50;
    const q = {};

    //generate query
    if (filterDto.userId) q['userId'] = filterDto.userId;
    if (filterDto.startTime && filterDto.endTime) {
      q['createdAt'] = { $gte: filterDto.startTime, $lte: filterDto.endTime };
    } else if (filterDto.startTime) {
      q['createdAt'] = { $gte: filterDto.startTime };
    } else if (filterDto.endTime) {
      q['createdAt'] = { $lte: filterDto.endTime };
    }

    const [data, itemCount] = await Promise.all([
      this.model
        .find(q)
        .sort({ createdAt: -1 })
        .skip(currentPage * perPage)
        .limit(perPage),
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

  async create(dto: EstimateCreateDto): Promise<Estimate> {
    dto = validate(dto, EstimateCreateDto);
    let { title, bundleIds, publicationIds, userId } = dto;

    const [bundleList, publicationList] = await Promise.all([
      this.bundleService.loadMany(bundleIds),
      this.publicationService.loadMany(publicationIds)
    ]);

    if (bundleIds && bundleIds.length) {
      assert(
        bundleList.length === bundleIds.length,
        new BadRequestException('Invalid bundle Ids')
      );
      let bundlePublicationIds = [];
      bundleList.forEach((e) => {
        bundlePublicationIds = [...bundlePublicationIds, ...e.publicationIds];
      });
      publicationIds = publicationIds.filter(
        (item) => !bundlePublicationIds.includes(item)
      );
    }

    if (publicationList && publicationList.length) {
      assert(
        publicationList.length === publicationIds.length,
        new BadRequestException('Invalid publication Ids')
      );
    }

    let maxIndex = null;

    if (bundleList.length && publicationList.length) {
      maxIndex =
        publicationList.length > bundleList.length
          ? publicationList.length
          : bundleList.length;
    } else if (bundleList.length) {
      maxIndex = bundleList.length;
    } else {
      maxIndex = publicationList.length;
    }

    let totalCredits = 0;
    let traffic = 0;

    for (let i = 0; i < maxIndex; i++) {
      if (!!bundleList[i]) {
        totalCredits += bundleList[i].price;
        traffic += bundleList[i].traffic;
      }
      if (!!publicationList[i]) {
        totalCredits += publicationList[i].price;
        traffic += publicationList[i].stats.traffic;
      }
    }

    return this.model.create({
      title,
      userId: userId,
      publicationIds,
      bundleIds,
      totalCredits,
      traffic
    });
  }

  async delete(_id: string, me: IMe): Promise<boolean> {
    let articleObj = await this._validateOwnership(_id, me.userId);
    const res = await this.model.softDelete({ _id });
    await this.loaderService.cleanCacheById(_id);
    return true;
  }
}
