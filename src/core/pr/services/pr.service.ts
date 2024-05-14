import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Pr } from '../pr.schema';
import { PrLoaderService } from './pr.loader.service';
import { Model } from 'mongoose';
import { paginateResponse } from 'src/common/utils';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { PaginationInputDto } from 'src/common/dto/pagination.input.dto';
import { PrFilterDto } from '../dto/pr.filter.dto';
import { validate } from 'nestjs-zod';
import { IMe } from 'src/common/graphql/interface/context.interface';
import * as assert from 'assert';
import { PrUpdateStatusDto } from '../dto/pr.update.status.dto';
import { PrStatusEnum } from '../enum/pr.status.enum';
import { PrCreateBulkDto } from '../dto/pr.create.bulk.dto';
import { ArticleService } from 'src/core/article/services/article.service';
import { PublicationService } from 'src/core/publication/services/publication.service';
import { PublicationTimelineEnum } from 'src/core/publication/enum/publication.timeline.enum';

@Injectable()
export class PrService {
  constructor(
    @InjectModel(Pr.name)
    protected model: Model<Pr>,
    private loaderService: PrLoaderService,
    private articleService: ArticleService,
    private publicationService: PublicationService
  ) {}

  async load(_id: string): Promise<Pr> {
    const loader = await this.loaderService.init();
    return loader.load(_id);
  }

  async loadMany(ids: string[], q: Record<string, any> = null): Promise<Pr[]> {
    const loader = await this.loaderService.init(q);
    return loader.loadMany(ids);
  }

  async getFilteredPaginated(
    paginationDto: PaginationInputDto,
    filterDto: PrFilterDto,
    me?: IMe
  ) {
    paginationDto = validate(paginationDto, PaginationInputDto);
    filterDto = validate(filterDto, PrFilterDto);
    let { currentPage, perPage } = paginationDto;
    perPage = perPage <= 50 ? perPage : 50;
    const q = {};

    if (me.user.type === UserTypeEnum.USER) {
      assert(
        filterDto.articleId,
        new BadRequestException('articleId is mandatory')
      );
      q['userId'] = me.userId;
      q['articleId'] = filterDto.articleId;
    } else {
      //generate query
      if (filterDto.userId) q['userId'] = filterDto.userId;
      if (filterDto.articleId) q['articleId'] = filterDto.articleId;
      if (filterDto.publicationId) q['publicationId'] = filterDto.publicationId;
      if (filterDto.status) q['status'] = filterDto.status;
      if (filterDto.startTime && filterDto.endTime) {
        q['createdAt'] = { $gte: filterDto.startTime, $lte: filterDto.endTime };
      } else if (filterDto.startTime) {
        q['createdAt'] = { $gte: filterDto.startTime };
      } else if (filterDto.endTime) {
        q['createdAt'] = { $lte: filterDto.endTime };
      }
    }

    const [data, itemCount] = await Promise.all([
      this.model
        .find(q)
        .sort({ publishBy: -1 })
        .skip(currentPage * perPage)
        .limit(perPage),
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

  async updateStatus(dto: PrUpdateStatusDto): Promise<boolean> {
    dto = validate(dto, PrUpdateStatusDto);
    const { id, status, rejectionReason } = dto;
    const prObj = await this.load(id);
    const updateObj = {};
    assert(!!prObj, new BadRequestException('invalid pr id'));

    assert(
      prObj.status === PrStatusEnum.PENDING ||
        prObj.status === PrStatusEnum.SCHEDULED,
      new BadRequestException(`PR is in ${prObj.status} state`)
    );

    switch (status) {
      case PrStatusEnum.SCHEDULED: {
        assert(
          prObj.status === PrStatusEnum.PENDING,
          new BadRequestException('PR not in PENDING state')
        );
        break;
      }
      case PrStatusEnum.REJECTED: {
        assert(
          prObj.status === PrStatusEnum.PENDING ||
            prObj.status === PrStatusEnum.SCHEDULED,
          new BadRequestException(
            `PR in ${prObj.status} state cannot be rejected`
          )
        );
        assert(
          !!rejectionReason,
          new BadRequestException('rejection reason is needed to reject PR')
        );
        updateObj['rejectionReason'] = rejectionReason;
        break;
      }
      case PrStatusEnum.PUBLISHED: {
        assert(
          prObj.status === PrStatusEnum.SCHEDULED,
          new BadRequestException('PR not in SCHEDULED state')
        );
        break;
      }
      default:
        throw new BadRequestException(`status ${status} not handled for ADMIN`);
    }
    updateObj['status'] = status;
    await this.model.updateOne({ _id: id }, { $set: { ...updateObj } });
    return true;
  }

  async createBulk(dto: PrCreateBulkDto): Promise<boolean> {
    dto = validate(dto, PrCreateBulkDto);
    const { articleId, publicationIds } = dto;
    const [articleObj, publicationObjs] = await Promise.all([
      this.articleService.load(articleId),
      this.publicationService.loadMany(publicationIds)
    ]);
    const prBulkPayload = [];
    publicationObjs.forEach((e) => {
      let publishBy = new Date();
      switch (e.timeline) {
        case PublicationTimelineEnum.D1: {
          publishBy.setDate(publishBy.getDate() + 1);
          break;
        }
        case PublicationTimelineEnum.D2: {
          publishBy.setDate(publishBy.getDate() + 2);
          break;
        }
        case PublicationTimelineEnum.D5: {
          publishBy.setDate(publishBy.getDate() + 5);
          break;
        }
        case PublicationTimelineEnum.W1: {
          publishBy.setDate(publishBy.getDate() + 7);
          break;
        }
        case PublicationTimelineEnum.W2: {
          publishBy.setDate(publishBy.getDate() + 14);
          break;
        }
      }
      prBulkPayload.push({
        userId: articleObj.userId,
        articleId: articleObj._id,
        publicationId: e._id,
        status: PrStatusEnum.PENDING,
        publishBy,
        publishAt: articleObj.publishAt
      });
    });

    await this.model.insertMany(prBulkPayload);
    return true;
  }
}
