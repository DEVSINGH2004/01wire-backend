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
import { toCopperxUnits } from 'src/core/payment/providers/copperx/copperx.service';
import { PaymentAccessService } from 'src/core/payment/access/payment.access.service';

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
    private eventEmitter: EventEmitter2,
    private access: PaymentAccessService
  ) {}

  // CopperX test environment unless the live API (api.copperx.io) is used
  private get copperxTest() {
    return !String(this.configService.get('copperx', { infer: true })?.baseUrl || '').includes('api.copperx.io');
  }

  // A credit-pack purchase was paid (confirmed with the gateway by the caller).
  // The paid amount must match the pack; PENDING -> SUCCESS is one atomic step, so two
  // deliveries of the same webhook can never add the credits twice.
  async onTransactionSuccess(
    transactionId: string,
    paid?: { amountTotal: string; currency: string }
  ) {
    try {
      const transactionObj = await this.model.findOne({ _id: transactionId });
      assert(!!transactionObj, new BadRequestException('Transaction not found'));
      const credits = this.txnKindCreditMap[transactionObj.kind];
      assert(credits > 0, new BadRequestException('Not a credit pack purchase'));
      // A test-mode CopperX payment only counts for listed test accounts
      if (this.copperxTest && !(await this.access.canPay(transactionObj.userId, true))) {
        this.eventEmitter.emit(EventDomainEnum.SLACK, {
          action: EventActionEnum.SEND,
          data: `⚠️ CopperX TEST payment for credit pack ${transactionId} by an account that may not use test payments. No credits added.`
        });
        throw new BadRequestException('Test payments are not allowed for this account');
      }
      if (paid) {
        const expected = toCopperxUnits(transactionObj.amount);
        const okAmount = String(paid.amountTotal) === expected;
        const okCurrency = /^usdt$/i.test(paid.currency || '');
        if (!okAmount || !okCurrency) {
          this.eventEmitter.emit(EventDomainEnum.SLACK, {
            action: EventActionEnum.SEND,
            data: `⚠️ CopperX payment does not match credit pack ${transactionId}: paid ${paid.amountTotal} ${paid.currency}, expected ${expected} USDT. No credits added.`
          });
          throw new BadRequestException('Paid amount does not match the credit pack');
        }
      }
      const claimed = await this.model.findOneAndUpdate(
        { _id: transactionId, status: TransactionStatusEnum.PENDING },
        { $set: { status: TransactionStatusEnum.SUCCESS } },
        { new: true }
      );
      if (!claimed) return; // already handled (repeat delivery)
      try {
        await this.walletService.updateBalance(claimed.walletId, credits);
      } catch (e) {
        // Put it back so a retry can add the credits
        await this.model.updateOne(
          { _id: transactionId, status: TransactionStatusEnum.SUCCESS },
          { $set: { status: TransactionStatusEnum.PENDING } }
        );
        throw e;
      }
      const userObj = await this.userService.load(claimed.userId);
      this.eventEmitter.emit(EventDomainEnum.SLACK, {
        action: EventActionEnum.SEND,
        data: `💰 Recharge ${claimed.amount} USDT : ${userObj?.fullName} | ${userObj?.email}`
      });
    } catch (e) {
      this._logger.error(`onTransactionSuccess ${transactionId}: ${e?.message}`);
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
    // Buying credits with money: only accounts in PAYMENT_ALLOWED_USERS (for now)
    if (!('status' in dto))
      await this.access.assertCanPay(userId, this.copperxTest);
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
