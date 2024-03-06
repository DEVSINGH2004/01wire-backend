import { BadRequestException, Injectable } from '@nestjs/common';
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
import assert from 'assert';

@Injectable()
export class BundleService {
  constructor(
    @InjectModel(Bundle.name)
    protected model: Model<Bundle>,
    private loaderService: BundleLoaderService,
    private publicationService: PublicationService
  ) {}

  async load(_id: string): Promise<Bundle> {
    const loader = await this.loaderService.init();
    return loader.load(_id);
  }

  async loadMany(
    ids: string[],
    q: Record<string, any> = null
  ): Promise<Bundle[]> {
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
    const { publicationIds } = dto;
    const publicationList = await this.publicationService.loadMany(
      publicationIds
    );

    assert(
      publicationList.length === publicationIds.length,
      new BadRequestException('one or few of publication ids are invalid')
    );

    //TODO: calculate maxPrice
    return this.model.create(dto);
  }

  async update(dto: BundleUpdateDto): Promise<Bundle> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, BundleUpdateDto);
    const { id, ...needToUpdate } = dto;
    if (dto?.publicationIds?.length) {
      const publicationList = await this.publicationService.loadMany(
        dto.publicationIds
      );

      assert(
        publicationList.length === dto.publicationIds.length,
        new BadRequestException('one or few of publication ids are invalid')
      );
    }

    //TODO: calculate maxPrice
    const bundleObj = await this.model.findOneAndUpdate(
      { _id: id },
      { $set: { ...needToUpdate } },
      { new: true }
    );
    return bundleObj;
  }

  async delete(_id: string, me: IMe) {
    const res = await this.model.softDelete({ _id });
    /* if (res.modifiedCount) {
      this.eventEmitter.emit(EventDomainEnum.KEYWORD, {
        action: EventActionEnum.DELETE,
        data: { keywordId: _id }
      });
    } */
    return true;
  }
}
