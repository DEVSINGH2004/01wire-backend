import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Article } from '../article.schema';
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
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { ArticleUpdateStatusDto } from '../dto/article.update.status.dto';
import { BundleService } from 'src/core/bundle/services/bundle.service';
import { PublicationService } from 'src/core/publication/services/publication.service';
import { WalletService } from 'src/core/wallet/services/wallet.service';
import * as assert from 'assert';
import { SequenceService } from 'src/core/sequence/sequence.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventDomainEnum } from 'src/core/events/enum/event.domain.enum';
import { EventActionEnum } from 'src/core/events/enum/event.action.enum';
import { VisibilityEnum } from 'src/common/enum/visibility.enum';

@Injectable()
export class ArticleService {
  constructor(
    @InjectModel(Article.name)
    protected model: Model<Article>,
    private loaderService: ArticleLoaderService,
    private clientService: ClientService,
    private bundleService: BundleService,
    private publicationService: PublicationService,
    private walletService: WalletService,
    private sequenceService: SequenceService,
    private eventEmitter: EventEmitter2
  ) {}

  async load(id: string): Promise<Article> {
    if (!id) return null;
    const loader = await this.loaderService.init();
    return loader.load(id);
  }

  async loadMany(
    ids: string[],
    q: Record<string, any> = null
  ): Promise<Article[]> {
    if (!ids || !ids.length) return [];
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

  async getArticleStats(userId): Promise<Record<string, number>[]> {
    const stats = await this.model.aggregate([
      { $match: { userId: userId } },
      { $project: { status: true, _id: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: true, _id: false } }
    ]);
    return stats;
  }

  async getById(id: string, me: IMe): Promise<Article> {
    const obj = await this.load(id);
    if (!obj) return null;
    if (me.user.type === UserTypeEnum.USER && obj.userId !== me.userId)
      return null;
    if (
      me.user.type === UserTypeEnum.ADMIN &&
      obj.status === ArticleStatusEnum.SUBMITTED
    ) {
      await this.model.updateOne(
        { _id: id },
        { $set: { status: ArticleStatusEnum.REVIEW } }
      );
      //TODO: send notification to user thaht article status has been changed to REVIEW
    }
    return obj;
  }

  async getFilteredPaginated(
    paginationDto: PaginationInputDto,
    filterDto: ArticleFilterDto,
    me?: IMe
  ) {
    paginationDto = validate(paginationDto, PaginationInputDto);
    filterDto = validate(filterDto, ArticleFilterDto);
    let { currentPage, perPage } = paginationDto;
    perPage = perPage <= 50 ? perPage : 50;
    const q = {};

    if (me.user.type === UserTypeEnum.ADMIN) {
      /* q['status'] = {
        $in: [
          ArticleStatusEnum.SUBMITTED,
          ArticleStatusEnum.AWAITING_APPROVAL,
          ArticleStatusEnum.SCHEDULED
        ]
      }; */
      if (filterDto.userId) q['userId'] = filterDto.userId;
    } else {
      q['userId'] = me.userId;
    }

    //generate query
    if (filterDto.prId) q['prId'] = filterDto.prId;
    if (filterDto.clientId) q['clientId'] = filterDto.clientId;
    if (filterDto.status) q['status'] = { $in: filterDto.status };
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

    const bundles = await this.bundleService.loadMany(dto.bundleIds);
    const isAnyBundleNotPublished = bundles.some(
      (b) => b.visibility !== VisibilityEnum.PUBLISHED
    );

    assert(
      !isAnyBundleNotPublished,
      new BadRequestException('one or few bundles are not published')
    );

    const publications = await this.publicationService.loadMany(
      dto.publicationIds
    );
    const isAnyPublicationNotPublished = publications.some(
      (p) => p.visibility !== VisibilityEnum.PUBLISHED
    );
    assert(
      !isAnyPublicationNotPublished,
      new BadRequestException('one or few publications are not published')
    );

    const prId = await this.sequenceService.getNextSequence('article');
    return this.model.create({ ...dto, prId, status: ArticleStatusEnum.DRAFT });
  }

  async update(dto: ArticleUpdateDto): Promise<Article> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, ArticleUpdateDto);
    // eslint-disable-next-line prefer-const
    let { id, userId, bundleIds, publicationIds, ...needToUpdate } = dto;
    let articleObj = await this._validateOwnership(id, userId);

    //check if bundleId or publicationId is provided
    if (
      articleObj.status === ArticleStatusEnum.DRAFT &&
      ((bundleIds && bundleIds.length) ||
        (publicationIds && publicationIds.length))
    ) {
      const [bundleList, publicationList] = await Promise.all([
        this.bundleService.loadMany(bundleIds),
        this.publicationService.loadMany(publicationIds)
      ]);

      const isAnyBundleNotPublished = bundleList.some(
        (b) => b.visibility !== VisibilityEnum.PUBLISHED
      );

      assert(
        !isAnyBundleNotPublished,
        new BadRequestException('one or few bundles are not published')
      );

      const isAnyPublicationNotPublished = publicationList.some(
        (p) => p.visibility !== VisibilityEnum.PUBLISHED
      );
      assert(
        !isAnyPublicationNotPublished,
        new BadRequestException('one or few publications are not published')
      );

      if (bundleIds && bundleIds.length) {
        assert(
          bundleList.length === bundleIds.length,
          new BadRequestException('Invalid bundle Ids')
        );
        let bundlePublicationIds = [];
        bundleList.forEach((e) => {
          bundlePublicationIds = [...bundlePublicationIds, ...e.publicationIds];
        });
        publicationIds = publicationIds.filter(
          (item) => !bundlePublicationIds.includes(item)
        );
      }

      if (publicationList && publicationList.length) {
        assert(
          publicationList.length === publicationIds.length,
          new BadRequestException('Invalid publication Ids')
        );
      }

      let maxIndex = null;

      if (bundleList.length && publicationList.length) {
        maxIndex =
          publicationList.length > bundleList.length
            ? publicationList.length
            : bundleList.length;
      } else if (bundleList.length) {
        maxIndex = bundleList.length;
      } else {
        maxIndex = publicationList.length;
      }

      let totalCredits = 0;
      for (let i = 0; i < maxIndex; i++) {
        if (!!bundleList[i]) totalCredits += bundleList[i].price;
        if (!!publicationList[i]) totalCredits += publicationList[i].price;
      }

      needToUpdate['totalCredits'] = totalCredits;
    }

    //validate client ownership if changed
    if (
      needToUpdate.clientId &&
      articleObj.clientId !== needToUpdate.clientId
    ) {
      await this.clientService.validateOwnership(needToUpdate.clientId, userId);
    }

    assert(
      articleObj.status === ArticleStatusEnum.DRAFT ||
        articleObj.status === ArticleStatusEnum.AWAITING_APPROVAL,
      new BadRequestException(
        `PR in ${articleObj.status} state cannot be edited`
      )
    );

    if (articleObj.status === ArticleStatusEnum.DRAFT) {
      needToUpdate['bundleIds'] = bundleIds;
      needToUpdate['publicationIds'] = publicationIds;
    }

    articleObj = await this.model.findOneAndUpdate(
      { _id: id, userId },
      { $set: needToUpdate },
      { new: true }
    );
    await this.loaderService.cleanCacheById(id);
    return articleObj;
  }

  async updateStatus(dto: ArticleUpdateStatusDto, me: IMe): Promise<Article> {
    dto = validate(dto, ArticleUpdateStatusDto);
    const { id, status, notes } = dto;
    const { userId, userType } = me;
    const articleObj =
      userType === UserTypeEnum.ADMIN
        ? await this.load(id)
        : await this._validateOwnership(id, userId);
    const updateObj = {};

    if (userType === UserTypeEnum.USER) {
      assert(
        status === ArticleStatusEnum.SUBMITTED,
        new BadRequestException('You can only submit PR')
      );
      assert(
        articleObj.status === ArticleStatusEnum.DRAFT ||
          articleObj.status === ArticleStatusEnum.AWAITING_APPROVAL,
        new BadRequestException(`PR being processed or already processed`)
      );

      //Create Order only when PR being submitted from DRAFT state
      if (articleObj.status === ArticleStatusEnum.DRAFT) {
        const walletObj = await this.walletService.getByUserId(userId);
        assert(
          walletObj.balance >= articleObj.totalCredits,
          new BadRequestException('Insufficient credits in wallet')
        );
        // const maxCounter =
        //   articleObj.publicationIds > articleObj.bundleIds
        //     ? articleObj.publicationIds.length
        //     : articleObj.bundleIds.length;
        //
        // const orderList = [];
        //
        // for (let i = 0; i < maxCounter; i++) {}
        //
        // if (articleObj.bundleIds.length) {
        //   const bundleList = await this.bundleService.loadMany(
        //     articleObj.bundleIds
        //   );
        //
        //   bundleList.forEach((bundle) => {
        //     bundle.publicationIds.forEach((pubId) =>
        //       orderList.push({
        //         userId: articleObj.userId,
        //         articleId: articleObj._id,
        //         prId: articleObj.prId,
        //         publicationId: pubId,
        //         bundleId: bundle._id,
        //         status: OrderStatusEnum.PENDING,
        //         publishAt: articleObj.publishAt
        //       })
        //     );
        //   });
        // }
        //
        // articleObj.publicationIds.forEach((pubId) =>
        //   orderList.push({
        //     userId: articleObj.userId,
        //     articleId: articleObj._id,
        //     prId: articleObj.prId,
        //     publicationId: pubId,
        //     status: OrderStatusEnum.PENDING
        //   })
        // );
        //
        this.eventEmitter.emit(EventDomainEnum.ORDER, {
          action: EventActionEnum.CREATE,
          data: {
            ...articleObj.toObject(),
            articleId: articleObj._id,
            _id: undefined
          }
        });

        await this.walletService.debitBalanceByUserId(
          userId,
          articleObj.totalCredits
        );
      }
    } else {
      assert(
        status === ArticleStatusEnum.AWAITING_APPROVAL ||
          status === ArticleStatusEnum.SCHEDULED ||
          status === ArticleStatusEnum.REJECTED ||
          status === ArticleStatusEnum.PUBLISHED,
        new BadRequestException(`This action is only for user`)
      );
      assert(
        articleObj.status === ArticleStatusEnum.REVIEW ||
          articleObj.status === ArticleStatusEnum.SUBMITTED ||
          articleObj.status === ArticleStatusEnum.AWAITING_APPROVAL ||
          articleObj.status === ArticleStatusEnum.SCHEDULED,
        new BadRequestException(`PR is in ${articleObj.status} state`)
      );

      switch (status) {
        case ArticleStatusEnum.AWAITING_APPROVAL: {
          assert(
            articleObj.status === ArticleStatusEnum.SUBMITTED ||
              articleObj.status === ArticleStatusEnum.REVIEW,
            new BadRequestException('PR not in SUBMITTED/REVIEW state')
          );
          updateObj['notes'] = notes;
          break;
        }
        case ArticleStatusEnum.SCHEDULED: {
          assert(
            articleObj.status === ArticleStatusEnum.SUBMITTED ||
              articleObj.status === ArticleStatusEnum.REVIEW,
            new BadRequestException('PR not in SUBMITTED/REVIEW state')
          );
          break;
        }
        case ArticleStatusEnum.REJECTED: {
          assert(
            articleObj.status === ArticleStatusEnum.SUBMITTED ||
              articleObj.status === ArticleStatusEnum.REVIEW ||
              articleObj.status === ArticleStatusEnum.AWAITING_APPROVAL ||
              articleObj.status === ArticleStatusEnum.SCHEDULED,
            new BadRequestException(
              `PR in ${articleObj.status} state cannot be rejected`
            )
          );
          assert(
            !!notes,
            new BadRequestException('notes is needed to reject PR')
          );
          updateObj['notes'] = notes;
          break;
        }
        case ArticleStatusEnum.PUBLISHED: {
          assert(
            articleObj.status === ArticleStatusEnum.SCHEDULED,
            new BadRequestException('PR not in SCHEDULED state')
          );
          break;
        }
        default:
          throw new BadRequestException(
            `status ${status} not handled for ADMIN`
          );
      }
    }
    updateObj['status'] = status;
    const res = await this.model.findOneAndUpdate(
      { _id: id },
      { $set: { ...updateObj } },
      { new: true }
    );
    await this.loaderService.cleanCacheById(id);
    return res;
  }

  async delete(_id: string, me: IMe) {
    const articleObj = await this._validateOwnership(_id, me.userId);
    assert(
      articleObj.status === ArticleStatusEnum.DRAFT ||
        articleObj.status === ArticleStatusEnum.REJECTED,
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
    await this.loaderService.cleanCacheById(_id);
    return true;
  }
}
