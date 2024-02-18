import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Article, ArticleDocument } from '../article.schema';
import { Model } from 'mongoose';
import { PaginationInputDto } from 'src/common/dto/pagination.input.dto';
import { ArticleFilterDto } from '../dto/article.filter.dto';
import { validate } from 'nestjs-zod';
import { paginateResponse } from 'src/common/utils';
import { ArticleLoaderService } from './article.loader.service';

@Injectable()
export class ArticleService {
  constructor(
    @InjectModel(Article.name)
    protected model: Model<Article>,
    private loaderService: ArticleLoaderService
  ) {}

  async load(_id: string): Promise<Article> {
    const loader = await this.loaderService.init();
    return loader.load(_id);
  }

  async loadMany(
    ids: string[],
    q: Record<string, any> = null
  ): Promise<Article[]> {
    const loader = await this.loaderService.init(q);
    return loader.loadMany(ids);
  }

  async getById(id: string, userId?: string): Promise<ArticleDocument> {
    const obj = await this.load(id);
    if (!obj) return null;
    if (obj.userId !== userId) return null;
    return obj;
  }

  async getFilteredPaginated(
    userId: string,
    paginationDto: PaginationInputDto,
    filterDto: ArticleFilterDto
  ) {
    paginationDto = validate(paginationDto, PaginationInputDto);
    filterDto = validate(filterDto, ArticleFilterDto);
    let { currentPage, perPage } = paginationDto;
    perPage = perPage <= 50 ? perPage : 50;
    const q = { userId };

    //generate query
    if (filterDto.status) q['status'] = filterDto.status;
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
