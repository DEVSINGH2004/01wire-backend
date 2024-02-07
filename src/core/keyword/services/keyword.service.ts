import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import * as assert from 'assert';
import { Model } from 'mongoose';
import { validate } from 'nestjs-zod';
import { PaginationInputDto } from 'src/common/dto/pagination.input.dto';
import { IMe } from 'src/common/graphql/interface/context.interface';
import { paginateResponse } from 'src/common/utils';
import { KeywordCreateDto } from '../dto/keyword.create.dto';
import { KeywordFilterDto } from '../dto/keyword.filter.dto';
import { KeywordUpdateDto } from '../dto/keyword.update.dto';
import { KeywordTypeEnum } from '../enum/keyword.type.enum';
import { Keyword, KeywordDocument } from '../keyword.schema';
import { KeywordLoaderService } from './keyword.loader.service';
import { KeywordJoinDto } from '../dto/keyword.join.dto';
import { EventDomainEnum } from 'src/core/events/enum/event.domain.enum';
import { EventActionEnum } from 'src/core/events/enum/event.action.enum';

@Injectable()
export class KeywordService {
  constructor(
    @InjectModel(Keyword.name)
    protected model: Model<Keyword>,
    private loaderService: KeywordLoaderService,
    private eventEmitter: EventEmitter2
  ) {}

  async load(_id: string): Promise<Keyword> {
    const loader = await this.loaderService.init();
    return loader.load(_id);
  }

  async loadMany(
    ids: string[],
    q: Record<string, any> = null
  ): Promise<Keyword[]> {
    const loader = await this.loaderService.init(q);
    return loader.loadMany(ids);
  }

  async getKeywordById(id: string, userId?: string): Promise<KeywordDocument> {
    const obj = await this.load(id);
    if (!obj) return null;
    if (obj.type === KeywordTypeEnum.PUBLIC) return obj;
    if (obj.userId !== userId) return null;
    return obj;
  }

  private async validateOwnership(
    _id: string,
    userId: string
  ): Promise<Keyword> {
    const keywordObj = await this.load(_id);
    assert(!!keywordObj, new NotFoundException('Keyword not found'));
    assert(
      keywordObj.userId === userId,
      new BadRequestException('Invalid pool ownership')
    );
    return keywordObj;
  }

  async getPaginated(userId: string, paginationInputDto: PaginationInputDto) {
    let { currentPage, perPage } = paginationInputDto;
    perPage = perPage <= 50 ? perPage : 50;
    const q = { userId };
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

  async getFilteredPaginated(
    userId: string,
    paginationDto: PaginationInputDto,
    filterDto: KeywordFilterDto
  ) {
    const { currentPage, perPage } = validate(
      paginationDto,
      PaginationInputDto
    );
    const { type } = validate(filterDto, KeywordFilterDto);
    const q =
      type && type === KeywordTypeEnum.PUBLIC
        ? { type: KeywordTypeEnum.PUBLIC }
        : { userId };

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

  async createKeyword(dto: KeywordCreateDto): Promise<Keyword> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, KeywordCreateDto);

    //add trailing spaces to smaller word (length <= 3)
    dto.keywords = dto.keywords.map((word) => {
      word = word.trim();
      return word.length <= 3 ? ` ${word.toLowerCase()} ` : word.toLowerCase();
    });
    const { title, userId } = dto;
    const count = await this.model.countDocuments(
      { userId, title, deletedAt: null },
      { limit: 1 }
    );
    assert(count === 0, new BadRequestException('Keyword set already exists'));
    return this.model.create(dto);
  }

  async joinKeyword(dto: KeywordJoinDto): Promise<KeywordDocument> {
    const { id, title, userId } = validate(dto, KeywordJoinDto);
    const keywordObj = await this.load(id);
    assert(!!keywordObj, new NotFoundException('Keyword not found'));
    assert(
      keywordObj.type === KeywordTypeEnum.PUBLIC,
      new BadRequestException('Keyword is not public')
    );

    const keywordCount = await this.model.countDocuments({
      userId,
      title,
      deletedAt: null
    });
    assert(
      !keywordCount,
      new BadRequestException(`Keyword with title ${title} already exists`)
    );
    const payload = {
      userId,
      title,
      keywords: keywordObj.keywords,
      type: KeywordTypeEnum.PUBLIC_JOINED
    };
    return this.model.create(payload);
  }

  async updateKeyword(dto: KeywordUpdateDto): Promise<KeywordDocument> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, KeywordUpdateDto);
    const { id, userId, ...needToUpdate } = dto;
    await this.validateOwnership(id, userId);
    if (needToUpdate.keywords && needToUpdate.keywords.length) {
      needToUpdate.keywords = [...new Set(needToUpdate.keywords)];
      //add trailing spaces to smaller word (length <= 3)
      needToUpdate.keywords = needToUpdate.keywords.map((word) => {
        word = word.trim();
        return word.length <= 3
          ? ` ${word.toLowerCase()} `
          : word.toLowerCase();
      });
    }
    const keywordObj = await this.model
      .findOneAndUpdate(
        { _id: id, userId },
        { $set: { ...needToUpdate } },
        { new: true }
      )
      .exec();
    if (needToUpdate.keywords && needToUpdate.keywords.length) {
      this.eventEmitter.emit(EventDomainEnum.KEYWORD, {
        action: EventActionEnum.UPDATE,
        data: { keywordId: id }
      });
    }
    return keywordObj;
  }

  async deleteKeyword(_id: string, me: IMe) {
    await this.validateOwnership(_id, me.userId);
    const res = await this.model.softDelete({ _id });
    if (res.modifiedCount) {
      this.eventEmitter.emit(EventDomainEnum.KEYWORD, {
        action: EventActionEnum.DELETE,
        data: { keywordId: _id }
      });
    }
    return true;
  }
}
