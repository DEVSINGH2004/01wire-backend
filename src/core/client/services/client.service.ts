import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationInputDto } from 'src/common/dto/pagination.input.dto';
import { validate } from 'nestjs-zod';
import { paginateResponse } from 'src/common/utils';
import { IMe } from 'src/common/graphql/interface/context.interface';
import { ClientLoaderService } from './client.loader.service';
import { ClientFilterDto } from '../dto/client.filter.dto';
import { ClientCreateDto } from '../dto/client.create.dto';
import { ClientUpdateDto } from '../dto/client.update.dto';
import { Client } from '../client.schema';
import * as assert from 'assert';

@Injectable()
export class ClientService {
  constructor(
    @InjectModel(Client.name)
    protected model: Model<Client>,
    private loaderService: ClientLoaderService
  ) {}

  async load(_id: string): Promise<Client> {
    const loader = await this.loaderService.init();
    return loader.load(_id);
  }

  async loadMany(
    ids: string[],
    q: Record<string, any> = null
  ): Promise<Client[]> {
    const loader = await this.loaderService.init(q);
    return loader.loadMany(ids);
  }

  private async _validateOwnership(
    _id: string,
    userId: string
  ): Promise<Client> {
    const obj = await this.load(_id);
    assert(!!obj, new NotFoundException('client not found'));
    assert(
      obj.userId === userId,
      new BadRequestException('invalid client ownership')
    );
    return obj;
  }

  async getById(id: string, userId?: string): Promise<Client> {
    const obj = await this.load(id);
    if (!obj) return null;
    if (obj.userId !== userId) return null;
    return obj;
  }

  async getFilteredPaginated(
    userId: string,
    paginationDto: PaginationInputDto,
    filterDto: ClientFilterDto
  ) {
    paginationDto = validate(paginationDto, PaginationInputDto);
    filterDto = validate(filterDto, ClientFilterDto);
    let { currentPage, perPage } = paginationDto;
    perPage = perPage <= 50 ? perPage : 50;
    const q = { userId };

    //generate query
    if (filterDto.type) q['type'] = filterDto.type;
    if (filterDto.type) q['categories'] = { $in: filterDto.categories };

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

  async create(dto: ClientCreateDto): Promise<Client> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, ClientCreateDto);
    const { userId, title } = dto;
    const isFound = await this.model.countDocuments({ title, userId });
    assert(
      isFound === 0,
      new BadRequestException(`A client with title ${title} already exists`)
    );
    return this.model.create(dto);
  }

  async update(dto: ClientUpdateDto): Promise<Client> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, ClientUpdateDto);
    const { id, userId, ...needToUpdate } = dto;
    await this._validateOwnership(id, userId);
    if (dto.title) {
      const isFound = await this.model.countDocuments({
        _id: { $ne: id },
        title: dto.title,
        userId
      });
      assert(
        isFound === 0,
        new BadRequestException(
          `A client with title ${dto.title} already exists`
        )
      );
    }
    const ClientObj = await this.model.findOneAndUpdate(
      { _id: id, userId },
      { $set: needToUpdate },
      { new: true }
    );
    return ClientObj;
  }

  async delete(_id: string, me: IMe) {
    await this._validateOwnership(_id, me.userId);
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
