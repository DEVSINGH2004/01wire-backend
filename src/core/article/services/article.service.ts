import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Article, ArticleDocument } from '../article.schema';
import { Model } from 'mongoose';
import { PaginationInputDto } from 'src/common/dto/pagination.input.dto';
import { ArticleFilterDto } from '../dto/article.filter.dto';
import { validate } from 'nestjs-zod';
import { paginateResponse } from 'src/common/utils';
import { ArticleLoaderService } from './article.loader.service';
import { ArticleCreateDto } from '../dto/article.create.dto';
import { ArticleUpdateDto } from '../dto/article.update.dto';
import { IMe } from 'src/common/graphql/interface/context.interface';
import { ArticleStatusEnum } from '../enum/article.status.enum';
import { ClientService } from 'src/core/client/services/client.service';
import * as assert from 'assert';

@Injectable()
export class ArticleService {
  constructor(
    @InjectModel(Article.name)
    protected model: Model<Article>,
    private loaderService: ArticleLoaderService,
    private clientService: ClientService
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

  private async _validateOwnership(
    _id: string,
    userId: string
  ): Promise<Article> {
    const obj = await this.load(_id);
    assert(!!obj, new NotFoundException('article not found'));
    assert(
      obj.userId === userId,
      new BadRequestException('invalid article ownership')
    );
    return obj;
  }

  async getById(id: string, userId?: string): Promise<Article> {
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
    if (filterDto.clientId) q['clientId'] = filterDto.clientId;
    if (filterDto.status) q['status'] = filterDto.status;
    if (filterDto.categories) q['category'] = { $in: filterDto.categories };
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

  async create(dto: ArticleCreateDto): Promise<Article> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, ArticleCreateDto);
    const { clientId, userId } = dto;
    await this.clientService.validateOwnership(clientId, userId);
    return this.model.create({ ...dto, status: ArticleStatusEnum.DRAFT });
  }

  async update(dto: ArticleUpdateDto): Promise<Article> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, ArticleUpdateDto);
    const { id, userId, ...needToUpdate } = dto;
    let articleObj = await this._validateOwnership(id, userId);

    //validate client ownership if changed
    if (
      needToUpdate.clientId &&
      articleObj.clientId !== needToUpdate.clientId
    ) {
      await this.clientService.validateOwnership(needToUpdate.clientId, userId);
    }

    assert(
      articleObj.status === ArticleStatusEnum.DRAFT ||
        articleObj.status === ArticleStatusEnum.REJECTED,
      new BadRequestException(
        `article in ${articleObj.status} state cannot be edited`
      )
    );

    articleObj = await this.model.findOneAndUpdate(
      { _id: id, userId },
      { $set: { ...needToUpdate } },
      { new: true }
    );
    await this.loaderService.cleanCacheById(id);
    return articleObj;
  }

  async delete(_id: string, me: IMe) {
    let articleObj = await this._validateOwnership(_id, me.userId);
    assert(
      articleObj.status === ArticleStatusEnum.DRAFT,
      new BadRequestException(
        `article in ${articleObj.status} state cannot be deleted`
      )
    );
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
