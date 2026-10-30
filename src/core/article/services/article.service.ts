import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef
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
import { OrderService } from 'src/core/order/services/order.service';
import { OrderStatusEnum } from 'src/core/order/enum/order.status.enum';

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
    private eventEmitter: EventEmitter2,

    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService
  ) {}

  async load(id: string, q: Record<string, any> = null): Promise<Article> {
    if (!id) return null;
    const loader = await this.loaderService.init(q);
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
      {
        $match: {
          $or: [
            { userId: userId, deletedAt: null },
            { userId: userId, deletedAt: { $exists: false } }
          ]
        }
      },
      { $project: { status: true, _id: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: true, _id: false } }
    ]);
    return stats;
  }

  async getById(id: string, me: IMe): Promise<Article> {
    const obj = await this.load(id);
    if (!obj) return null;
    // Anonymous callers (public /share-release links) never see drafts
    if (!me && obj.status === ArticleStatusEnum.DRAFT) return null;
    if (me !== null && me.user.type === UserTypeEnum.USER && obj.userId !== me.userId)
      return null;
    if (
      me !== null && 
      me.user.type === UserTypeEnum.ADMIN &&
      obj.status === ArticleStatusEnum.SUBMITTED
    ) {
      await this.model.updateOne(
        { _id: id, status: ArticleStatusEnum.SUBMITTED },
        { $set: { status: ArticleStatusEnum.REVIEW } }
      );
      await this.loaderService.cleanCacheById(id);
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
    const { currentPage, perPage } = paginationDto;
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
    if (filterDto?.status?.length) q['status'] = { $in: filterDto.status };
    if (filterDto?.categories?.length)
      q['category'] = { $in: filterDto.categories };
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
        .sort({ updatedAt: -1 })
        .limit(perPage)
        .skip(currentPage * perPage),
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

  async create(dto: ArticleCreateDto): Promise<Article> {
    Object.keys(dto).forEach(
      (key) => (dto[key] === null || dto[key] === '') && delete dto[key]
    );
    dto = validate(dto, ArticleCreateDto);
    const { clientId, userId } = dto;
    await this.clientService.validateOwnership(clientId, userId);

    const bundles = await this.bundleService.loadMany(dto.bundleIds);
    // Unknown ids come back as null placeholders from loadMany
    assert(!bundles.includes(null), new BadRequestException('Invalid bundle Ids'));
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
    assert(
      !publications.includes(null),
      new BadRequestException('Invalid publication Ids')
    );
    const isAnyPublicationNotPublished = publications.some(
      (p) => p.visibility !== VisibilityEnum.PUBLISHED
    );
    assert(
      !isAnyPublicationNotPublished,
      new BadRequestException('one or few publications are not published')
    );

    // Same price as update(): every selected bundle + publication, once each.
    // Clients can't send totalCredits (the DTO strips it).
    const totalCredits = [...bundles, ...publications].reduce(
      (sum, item) => sum + item.price,
      0
    );

    const prId = await this.sequenceService.getNextSequence('article');
    return this.model.create({
      ...dto,
      totalCredits,
      prId,
      status: ArticleStatusEnum.DRAFT
    });
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

      // Unknown ids come back as null placeholders from loadMany
      assert(
        !bundleList.includes(null),
        new BadRequestException('Invalid bundle Ids')
      );
      assert(
        !publicationList.includes(null),
        new BadRequestException('Invalid publication Ids')
      );

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
    // Fresh read: the decision below must not be based on a cached status
    await this.loaderService.cleanCacheById(id);
    const articleObj =
      userType === UserTypeEnum.ADMIN
        ? await this.load(id)
        : await this._validateOwnership(id, userId);
    assert(!!articleObj, new BadRequestException('PR not found'));
    const updateObj = {};
    let isRefund = false;

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
        await this._submitDraft(articleObj);
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
          const ordersCount = await this.orderService.countByQuery({
            articleId: articleObj._id,
            status: OrderStatusEnum.PUBLISHED,
            deletedAt: null
          });

          assert(
            !ordersCount,
            new BadRequestException('One or more orders are PUBLISHED')
          );

          updateObj['notes'] = notes;
          isRefund = true;
          break;
        }
        case ArticleStatusEnum.PUBLISHED: {
          assert(
            articleObj.status === ArticleStatusEnum.SCHEDULED,
            new BadRequestException('PR not in SCHEDULED state')
          );
          const orders = await this.orderService.getByQuery({
            articleId: articleObj._id
          });
          let isAnyOrderPublished = false;
          for (const order of orders) {
            if (order.status === OrderStatusEnum.PUBLISHED) {
              isAnyOrderPublished = true;
            }
            if (order.status === OrderStatusEnum.PENDING) {
              throw new BadRequestException(
                'One or more orders are in PENDING state'
              );
            }
          }

          assert(
            isAnyOrderPublished,
            new BadRequestException(
              'One or more orders should be PUBLISHED before article'
            )
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
    // Only apply the change if the PR is still in the status checked above, so
    // two concurrent requests cannot both act (e.g. reject + refund twice).
    // A submit from DRAFT was already claimed atomically as SUBMITTED.
    const submittedFromDraft =
      userType === UserTypeEnum.USER &&
      articleObj.status === ArticleStatusEnum.DRAFT;
    const expectedStatus = submittedFromDraft
      ? ArticleStatusEnum.SUBMITTED
      : articleObj.status;
    const res = await this.model.findOneAndUpdate(
      { _id: id, status: expectedStatus },
      { $set: { ...updateObj } },
      { new: true }
    );
    await this.loaderService.cleanCacheById(id);
    if (!res) {
      // The draft submit itself succeeded (debit + orders); only a racing
      // admin read moved it on, so report the PR as it is now
      if (submittedFromDraft) return this.load(id);
      throw new ConflictException(
        'This PR was just updated by someone else. Refresh and try again.'
      );
    }
    if (isRefund === true) {
      await Promise.all([
        this.walletService.creditBalanceByUserId({
          userId: articleObj.userId,
          amount: articleObj.totalCredits,
          notes: `Refund for PR ID: ${articleObj.prId}`
        }),
        this.orderService.rejectBulkByArticleId(articleObj._id, notes)
      ]);
    }
    return res;
  }

  // DRAFT -> SUBMITTED: validate, claim, debit, create orders. Any failure
  // after a write is rolled back, so no order can exist without a debit.
  private async _submitDraft(articleObj: Article) {
    const { _id, userId, prId, totalCredits } = articleObj;
    const publicationIds = articleObj.publicationIds || [];
    const bundleIds = articleObj.bundleIds || [];

    assert(
      publicationIds.length > 0 || bundleIds.length > 0,
      new BadRequestException('Select at least one publication or bundle')
    );
    assert(totalCredits > 0, new BadRequestException('Invalid PR amount'));

    // Atomic claim: only one concurrent submit can move the PR out of DRAFT
    const claimed = await this.model.findOneAndUpdate(
      { _id, status: ArticleStatusEnum.DRAFT },
      { $set: { status: ArticleStatusEnum.SUBMITTED } }
    );
    await this.loaderService.cleanCacheById(_id);
    assert(
      !!claimed,
      new BadRequestException('PR being processed or already processed')
    );

    const revertToDraft = async () => {
      await this.model.updateOne(
        { _id },
        { $set: { status: ArticleStatusEnum.DRAFT } }
      );
      await this.loaderService.cleanCacheById(_id);
    };

    try {
      await this.walletService.debitBalanceByUserId({
        userId,
        amount: totalCredits,
        notes: `Debited for PR ID: ${prId}`
      });
    } catch (e) {
      await revertToDraft();
      throw e;
    }

    try {
      await this.orderService.createBulk({
        userId,
        articleId: _id,
        prId,
        publicationIds,
        bundleIds
      });
    } catch (e) {
      await this.orderService.deletePendingByArticleId(_id);
      await this.walletService.creditBalanceByUserId({
        userId,
        amount: totalCredits,
        notes: `Refund for PR ID: ${prId} (submit failed)`
      });
      await revertToDraft();
      throw e;
    }
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
