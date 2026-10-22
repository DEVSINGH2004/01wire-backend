import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { validate } from 'nestjs-zod';
import { TransactionKindEnum } from '../enum/transaction.kind.enum';
import { Transaction } from '../transaction.schema';
import { ConfigService } from '@nestjs/config';
import { ConfigVariablesType } from 'src/config';
import { Model } from 'mongoose';
import { TransactionCreateDto } from '../dto/transaction.create.dto';
import { CouponService } from 'src/core/coupon/services/coupon.service';
import { TransactionStatusEnum } from '../enum/transaction.status.enum';
import { TransactionTypeEnum } from '../enum/transaction.type.enum';
import { WalletService } from 'src/core/wallet/services/wallet.service';
import { PaginationInputDto } from 'src/common/dto/pagination.input.dto';
import { TransactionFilterDto } from '../dto/transaction.filter.dto';
import { paginateResponse } from 'src/common/utils';
import { UserService } from 'src/core/user/services/user.service';
import { PaymentService } from 'src/core/payment/payment.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventDomainEnum } from 'src/core/events/enum/event.domain.enum';
import { EventActionEnum } from 'src/core/events/enum/event.action.enum';
import * as assert from 'assert';

@Injectable()
export class TransactionService {
  private _logger = new Logger(TransactionService.name);
  private txnKindCreditMap: Record<TransactionKindEnum, number> = {
    [TransactionKindEnum.WALLET]: null,
    [TransactionKindEnum.CREDITS_100]: 100,
    [TransactionKindEnum.CREDITS_500]: 500,
    [TransactionKindEnum.CREDITS_1000]: 1000,
    [TransactionKindEnum.CREDITS_5000]: 5000,
    [TransactionKindEnum.ADMIN_UPDATE]: null
  };
  constructor(
    @InjectModel(Transaction.name)
    private model: Model<Transaction>,
    private configService: ConfigService<ConfigVariablesType>,
    private couponService: CouponService,
    private userService: UserService,
    private walletService: WalletService,
    private paymentService: PaymentService,
    private eventEmitter: EventEmitter2
  ) {}

  async onTransactionSuccess(transactionId) {
    try {
      const transactionObj = await this.model.findOne({ _id: transactionId });
      assert(
        transactionObj.status === TransactionStatusEnum.PENDING,
        new BadRequestException('Transaction not in pending state')
      );
      transactionObj.status = TransactionStatusEnum.SUCCESS;
      await transactionObj.save();
      await this.walletService.updateBalance(
        transactionObj.walletId,
        this.txnKindCreditMap[transactionObj.kind]
      );
      const userObj = await this.userService.load(transactionObj.userId);
      this.eventEmitter.emit(EventDomainEnum.SLACK, {
        action: EventActionEnum.SEND,
        data: `💰 Recharge ${transactionObj.amount} USDT : ${userObj.fullName} | ${userObj.email}`
      });
    } catch (e) {
      console.log(
        `⚠ Error : onTransactionSuccess: ${transactionId} :`,
        e.mesaage
      );
    }
  }

  async getFilteredPaginated(
    userId: string,
    paginationDto: PaginationInputDto,
    filterDto: TransactionFilterDto
  ) {
    paginationDto = validate(paginationDto, PaginationInputDto);
    filterDto = validate(filterDto, TransactionFilterDto);
    const { currentPage, perPage } = paginationDto;
    const q = { userId, status: TransactionStatusEnum.SUCCESS };

    //generate query
    if (filterDto.type) q['type'] = filterDto.type;
    // if (filterDto.status) q['status'] = filterDto.status;
    if (filterDto.kind) q['kind'] = filterDto.kind;
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

  async create(dto: TransactionCreateDto, userId: string) {
    dto = validate(dto, TransactionCreateDto);
    const amount =
      'amount' in dto ? dto.amount : this.txnKindCreditMap[dto.kind];
    const status = 'status' in dto ? dto.status : TransactionStatusEnum.PENDING;
    // Reuse an identical PENDING purchase (retried checkout); completed
    // wallet/admin entries are always recorded, even if identical
    let transactionObj =
      status === TransactionStatusEnum.PENDING
        ? await this.model.findOne({ ...dto, status, userId })
        : null;
    if (!transactionObj) {
      const walletObj = await this.walletService.getByUserId(userId);
      transactionObj = await this.model.create({
        ...dto,
        userId,
        walletId: walletObj._id,
        amount,
        status
      });
    }
    let url: string;
    if (status === TransactionStatusEnum.PENDING) {
      const paymentSessionObj = await this.paymentService.createCheckoutSession(
        {
          userId,
          amount: amount * 100000000,
          dbTransactionId: transactionObj._id
        }
      );
      url = paymentSessionObj.url;
    }
    return url;
  }
}
