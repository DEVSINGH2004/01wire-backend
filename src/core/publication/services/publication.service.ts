import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Publication } from '../publication.schema';
import { Model } from 'mongoose';
import { PaginationInputDto } from 'src/common/dto/pagination.input.dto';
import { validate } from 'nestjs-zod';
import { paginateResponse } from 'src/common/utils';
import { PublicationLoaderService } from './publication.loader.service';

@Injectable()
export class PublicationService {
  constructor(
    @InjectModel(Publication.name)
    protected model: Model<Publication>,
    private loaderService: PublicationLoaderService
  ) {}

  async load(_id: string): Promise<Publication> {
    const loader = await this.loaderService.init();
    return loader.load(_id);
  }

  async loadMany(
    ids: string[],
    q: Record<string, any> = null
  ): Promise<Publication[]> {
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
}
