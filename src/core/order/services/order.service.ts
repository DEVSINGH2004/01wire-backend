import {
  BadRequestException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Order,
  OrderDocument,
  OrderTypeWithoutDocument
} from '../order.schema';
import { OrderLoaderService } from './order.loader.service';
import { FilterQuery, Model } from 'mongoose';
import { paginateResponse } from 'src/common/utils';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { PaginationInputDto } from 'src/common/dto/pagination.input.dto';
import { OrderFilterDto } from '../dto/order.filter.dto';
import { validate } from 'nestjs-zod';
import { IMe } from 'src/common/graphql/interface/context.interface';
import { OrderUpdateStatusDto } from '../dto/order.update.status.dto';
import { OrderStatusEnum } from '../enum/order.status.enum';
import { OrderCreateBulkDto } from '../dto/order.create.bulk.dto';
import { ArticleService } from 'src/core/article/services/article.service';
import { PublicationService } from 'src/core/publication/services/publication.service';
import { PublicationTimelineEnum } from 'src/core/publication/enum/publication.timeline.enum';
import * as assert from 'assert';
import { BundleService } from 'src/core/bundle/services/bundle.service';
import { Workbook as ExcelWorkbook } from 'exceljs';
import { PublicationTypeWithoutDocument } from 'src/core/publication/publication.schema';
import { Request, Response } from 'express';
import { orderBulkUpdateSchema } from '../dto/order.bulk.update.dto';
import { ArticleStatusEnum } from 'src/core/article/enum/article.status.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    protected model: Model<Order>,
    private loaderService: OrderLoaderService,
    private articleService: ArticleService,
    private publicationService: PublicationService,
    private bundleService: BundleService
  ) {}

  async load(id: string, q: Record<string, any> = null): Promise<Order> {
    if (!id) return null;
    const loader = await this.loaderService.init(q);
    return loader.load(id);
  }

  async loadMany(
    ids: string[],
    q: Record<string, any> = null
  ): Promise<Order[]> {
    if (!ids || !ids.length) return [];
    const loader = await this.loaderService.init(q);
    return loader.loadMany(ids);
  }

  async getFilteredPaginated(
    paginationDto: PaginationInputDto,
    filterDto: OrderFilterDto,
    me?: IMe
  ) {
    paginationDto = validate(paginationDto, PaginationInputDto);
    filterDto = validate(filterDto, OrderFilterDto);
    let { currentPage, perPage } = paginationDto;
    perPage = perPage <= 500 ? perPage : 50;
    let q: FilterQuery<OrderTypeWithoutDocument> = {};

    if (me?.user?.type === UserTypeEnum.USER) {
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
      if (filterDto.prId) q['prId'] = filterDto.prId;
      if (filterDto.status) q['status'] = filterDto.status;
      if (filterDto.startTime && filterDto.endTime) {
        q['createdAt'] = { $gte: filterDto.startTime, $lte: filterDto.endTime };
      } else if (filterDto.startTime) {
        q['createdAt'] = { $gte: filterDto.startTime };
      } else if (filterDto.endTime) {
        q['createdAt'] = { $lte: filterDto.endTime };
      }
      if (me === null) {
        if (!filterDto.articleId) throw new UnauthorizedException();
        q = { articleId: filterDto.articleId };
      }
    }

    const [data, itemCount] = await Promise.all([
      this.model
        .find(q)
        .sort({ publishBy: -1 })
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

  async rejectPendingByArticleId(articleId: string, notes: string) {
    return this.model.updateMany(
      { articleId, status: OrderStatusEnum.PENDING },
      { $set: { status: OrderStatusEnum.REJECTED, notes } }
    );
  }

  async updateStatus(dto: OrderUpdateStatusDto): Promise<boolean> {
    dto = validate(dto, OrderUpdateStatusDto);
    const { id, status, notes, url } = dto;
    const orderObj = await this.load(id);
    const updateObj = {};
    assert(!!orderObj, new BadRequestException('invalid article id'));
    const articleObj = await this.articleService.load(orderObj.articleId);
    assert(
      articleObj.status === ArticleStatusEnum.SCHEDULED,
      new BadRequestException('Article is not scheduled yet')
    );
    assert(
      orderObj.status === OrderStatusEnum.PENDING,
      new BadRequestException(`Order is in ${orderObj.status} state`)
    );

    switch (status) {
      case OrderStatusEnum.REJECTED: {
        assert(
          orderObj.status === OrderStatusEnum.PENDING,
          new BadRequestException(
            `PR in ${orderObj.status} state cannot be rejected`
          )
        );
        assert(
          !!notes,
          new BadRequestException('rejection reason is needed to reject PR')
        );
        updateObj['notes'] = notes;
        break;
      }
      case OrderStatusEnum.PUBLISHED: {
        assert(
          orderObj.status === OrderStatusEnum.PENDING,
          new BadRequestException('PR not in PENDING state')
        );
        assert(
          !!url,
          new BadRequestException('url is needed to mark PR as publish')
        );
        updateObj['url'] = url;
        break;
      }
      default:
        throw new BadRequestException(`status ${status} not handled for ADMIN`);
    }
    updateObj['status'] = status;
    await this.model.updateOne({ _id: id }, { $set: updateObj });
    await this.loaderService.cleanCacheById(id);
    return true;
  }

  async createBulk(dto: OrderCreateBulkDto): Promise<boolean> {
    dto = validate(dto, OrderCreateBulkDto);
    const bundleObjs = await this.bundleService.loadMany(dto.bundleIds);
    const bundlePubIds = [];
    const pubIdTobundleIdMap = new Map<string, string>();

    bundleObjs.forEach((bundle) => {
      bundle.publicationIds.forEach((pubId) => {
        pubIdTobundleIdMap.set(pubId, bundle._id);
      });
      bundlePubIds.push(...bundle.publicationIds);
    });

    const publicationObjs = await this.publicationService.loadMany([
      ...new Set([...dto.publicationIds, ...bundlePubIds])
    ]);
    const orderBulkPayload: OrderDocument[] = [];
    publicationObjs.forEach((e) => {
      const publishByDate = new Date();
      switch (e.timeline) {
        case PublicationTimelineEnum.D1: {
          publishByDate.setDate(publishByDate.getDate() + 1);
          break;
        }
        case PublicationTimelineEnum.D2: {
          publishByDate.setDate(publishByDate.getDate() + 2);
          break;
        }
        case PublicationTimelineEnum.D3: {
          publishByDate.setDate(publishByDate.getDate() + 3);
          break;
        }
        case PublicationTimelineEnum.D4: {
          publishByDate.setDate(publishByDate.getDate() + 4);
          break;
        }
        case PublicationTimelineEnum.D5: {
          publishByDate.setDate(publishByDate.getDate() + 5);
          break;
        }
        case PublicationTimelineEnum.W1: {
          publishByDate.setDate(publishByDate.getDate() + 7);
          break;
        }
        case PublicationTimelineEnum.W2: {
          publishByDate.setDate(publishByDate.getDate() + 14);
          break;
        }
        case PublicationTimelineEnum.W3: {
          publishByDate.setDate(publishByDate.getDate() + 21);
          break;
        }
        case PublicationTimelineEnum.W4: {
          publishByDate.setDate(publishByDate.getDate() + 28);
          break;
        }
        case PublicationTimelineEnum.W5: {
          publishByDate.setDate(publishByDate.getDate() + 35);
          break;
        }
      }
      const bundleId = pubIdTobundleIdMap.get(e._id);
      orderBulkPayload.push(
        new this.model({
          userId: dto.userId,
          articleId: dto.articleId,
          publicationId: e._id,
          status: OrderStatusEnum.PENDING,
          publishBy: publishByDate,
          bundleId,
          prId: dto.prId
        })
      );
    });

    await this.model.insertMany(orderBulkPayload);
    return true;
  }

  async getPendingTemplate(articleId: string, response: Response) {
    const orders = await this.model.aggregate<
      OrderTypeWithoutDocument & {
        publication: PublicationTypeWithoutDocument;
      }
    >([
      {
        $match: {
          articleId,
          status: OrderStatusEnum.PENDING
        }
      },
      {
        $lookup: {
          from: 'publications',
          localField: 'publicationId',
          foreignField: '_id',
          as: 'publication'
        }
      },
      {
        $unwind: '$publication'
      }
    ]);

    const workbook = new ExcelWorkbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    worksheet.columns = [
      { header: 'Order-Id', key: 'orderId', width: 40 },
      { header: 'Title', key: 'title', width: 15 },
      { header: 'Website', key: 'website', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Url', key: 'url', width: 40 },
      { header: 'Notes', key: 'notes', width: 40 }
    ];

    const rows = orders.map((o) => {
      return {
        title: o.publication.title,
        orderId: o._id,
        website: o.publication.url,
        status: o.status,
        url: o.url,
        notes: ''
      };
    });
    worksheet.addRows(rows);

    worksheet
      .getColumn('status')
      .eachCell({ includeEmpty: false }, function (cell) {
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: ['"PENDING,REJECTED,PUBLISHED"'],
          showErrorMessage: true,
          errorStyle: 'error',
          error: 'The value Valid'
        };
      });

    // set file name
    response.set('Content-Disposition', `attachment; filename="orders.xlsx"`);
    await workbook.xlsx.write(response);
  }

  async rejectBulkByArticleId(articleId: string, notes: string) {
    return this.model.updateMany(
      { articleId, status: OrderStatusEnum.PENDING },
      { $set: { notes, status: OrderStatusEnum.REJECTED } }
    );
  }

  async uploadUpdate(req: Request) {
    const workbook = new ExcelWorkbook();
    await workbook.xlsx.read(req);

    const worksheet = workbook.getWorksheet();

    // const header = ['Order-Id', 'Title', 'Website', 'Status', 'Url', 'Notes'];

    const data: {
      orderId: string;
      title: string;
      website: string;
      status: string;
      url: string;
      notes: string;
    }[] = [];
    worksheet.eachRow((row, rowNumber) => {
      // ignore header
      if (rowNumber === 1) {
        return;
      }
      const [, orderId, title, website, status, url, notes] =
        row.values as string[];
      data.push({
        orderId,
        title,
        website,
        status,
        url,
        notes
      });
    });

    const parsed = await orderBulkUpdateSchema.parseAsync(data);
    let needToUpdate = parsed.filter(
      (d) => d.status !== OrderStatusEnum.PENDING
    );

    const orderIds = needToUpdate.map((d) => d.orderId);
    const pendingOrdersInDb = await this.model.find({
      _id: { $in: orderIds },
      status: OrderStatusEnum.PENDING
    });

    if (pendingOrdersInDb.length === 0) {
      throw new BadRequestException('All orders are published');
    }

    const articleId = pendingOrdersInDb[0].articleId;
    const article = await this.articleService.load(articleId);

    if (
      article.status === ArticleStatusEnum.PUBLISHED ||
      article.status === ArticleStatusEnum.REJECTED
    ) {
      throw new BadRequestException(`article ${article.status}`);
    }

    needToUpdate = needToUpdate.filter((o) => {
      return pendingOrdersInDb.some((p) => p._id === o.orderId);
    });

    let publishArticleNeeded = false;
    // means we are updating all pending orders
    if (needToUpdate.length === pendingOrdersInDb.length) {
      publishArticleNeeded = true;
    }

    //NOTE: bulkWrite itself is not atomic, use it with a transaction

    // const session = await this.model.startSession();
    // await session.withTransaction(async (session) => {
    await this.model.bulkWrite(
      needToUpdate.map((o) => {
        return {
          updateOne: {
            filter: { _id: o.orderId },
            update: o
          }
        };
      })
      // {
      //   session
      // }
    );
    if (publishArticleNeeded) {
      // TODO: Update the article based on publishArticleNeeded
    }
    // });
  }

  async getByQuery(ob: FilterQuery<Order>) {
    return this.model.find(ob).lean();
  }

  async countByQuery(ob: FilterQuery<Order>) {
    return this.model.countDocuments(ob);
  }
}
