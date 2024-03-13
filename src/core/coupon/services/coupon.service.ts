import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Coupon } from '../coupon.schema';
import { Model } from 'mongoose';
import { CouponLoaderService } from './coupon.loader.service';
import { PaginationInputDto } from 'src/common/dto/pagination.input.dto';
import { validate } from 'nestjs-zod';
import { paginateResponse } from 'src/common/utils';
import { CouponCreateDto } from '../dto/coupon.create.dto';
import { CouponUpdateDto } from '../dto/coupon.update.dto';
import { IMe } from 'src/common/graphql/interface/context.interface';
import * as voucherCode from 'voucher-code-generator';
import * as assert from 'assert';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name)
    protected model: Model<Coupon>,
    private loaderService: CouponLoaderService
  ) {}

  async load(_id: string): Promise<Coupon> {
    const loader = await this.loaderService.init();
    return loader.load(_id);
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

  async create(dto: CouponCreateDto): Promise<Coupon> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, CouponCreateDto);
    const { category, type } = dto;
    const coupon = voucherCode.generate({ length: 6 })[0].toUpperCase();
    //TODO: calculate maxPrice
    return this.model.create({ ...dto, coupon });
  }

  async update(dto: CouponUpdateDto): Promise<Coupon> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, CouponUpdateDto);
    const { id, ...needToUpdate } = dto;

    //TODO: calculate maxPrice
    const CouponObj = await this.model.findOneAndUpdate(
      { _id: id },
      { $set: { ...needToUpdate } },
      { new: true }
    );
    await this.loaderService.cleanCacheById(id);
    return CouponObj;
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
