import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Publication } from '../publication.schema';
import { Model } from 'mongoose';
import { PaginationInputDto } from 'src/common/dto/pagination.input.dto';
import { validate } from 'nestjs-zod';
import { paginateResponse } from 'src/common/utils';
import { PublicationLoaderService } from './publication.loader.service';
import { PublicationFilterDto } from '../dto/publication.filter.dto';
import { PublicationCreateDto } from '../dto/publication.create.dto';
import { PublicationUpdateDto } from '../dto/publication.update.dto';
import { IMe } from 'src/common/graphql/interface/context.interface';
import * as assert from 'assert';

@Injectable()
export class PublicationService {
  constructor(
    @InjectModel(Publication.name)
    protected model: Model<Publication>,
    private loaderService: PublicationLoaderService
  ) {}

  async load(id: string): Promise<Publication> {
    if (!id) return null;
    const loader = await this.loaderService.init();
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

  async getFilteredPaginated(
    paginationDto: PaginationInputDto,
    filterDto: PublicationFilterDto
  ) {
    paginationDto = validate(paginationDto, PaginationInputDto);
    filterDto = validate(filterDto, PublicationFilterDto);
    let { currentPage, perPage } = paginationDto;
    perPage = perPage <= 50 ? perPage : 50;
    const q = {};

    if (filterDto?.filterIds?.length) q['_id'] = { $nin: filterDto.filterIds };
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

  async create(dto: PublicationCreateDto): Promise<Publication> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, PublicationCreateDto);
    const { title } = dto;
    const isFound = await this.model.countDocuments({ title });
    assert(
      isFound === 0,
      new BadRequestException(
        `A publication with title ${title} already exists`
      )
    );
    return this.model.create(dto);
  }

  async update(dto: PublicationUpdateDto): Promise<Publication> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, PublicationUpdateDto);
    const { id, ...needToUpdate } = dto;

    if (dto.title) {
      const isFound = await this.model.countDocuments({
        _id: { $ne: id },
        title: dto.title
      });
      assert(
        isFound === 0,
        new BadRequestException(
          `A publication with title ${dto.title} already exists`
        )
      );
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
