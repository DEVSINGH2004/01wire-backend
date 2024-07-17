import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Wallet } from '../wallet.schema';
import { Model } from 'mongoose';
import { WalletLoaderService } from './wallet.loader.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventDomainEnum } from 'src/core/events/enum/event.domain.enum';
import { EventActionEnum } from 'src/core/events/enum/event.action.enum';
import * as assert from 'assert';
import { TransactionKindEnum } from 'src/core/transaction/enum/transaction.kind.enum';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name)
    protected model: Model<Wallet>,
    private loaderService: WalletLoaderService,
    private eventEmitter: EventEmitter2
  ) {}

  async load(id: string, q: Record<string, any> = null): Promise<Wallet> {
    if (!id) return null;
    const loader = await this.loaderService.init(q);
    return loader.load(id);
  }

  async loadMany(
    ids: string[],
    q: Record<string, any> = null
  ): Promise<Wallet[]> {
    if (!ids || !ids.length) return [];
    const loader = await this.loaderService.init(q);
    return loader.loadMany(ids);
  }

  async getByUserId(userId: string) {
    return this.model.findOne({ userId });
  }

  async create(userId: string): Promise<Wallet> {
    const walletObj = await this.model.findOne({ userId });
    if (walletObj) return walletObj;
    return this.model.create({ userId, balance: 10 });
  }

  async updateBalance(_id: string, amount: number): Promise<void> {
    await this.model.updateOne({ _id }, { $inc: { balance: amount } });
    await this.loaderService.cleanCacheById(_id);
    const walletObj = await this.load(_id);
    this.eventEmitter.emit(EventDomainEnum.SSE, {
      action: EventActionEnum.SEND,
      data: {
        event: `${EventDomainEnum.WALLET}.${EventActionEnum.UPDATE}`,
        userId: walletObj.userId,
        balance: walletObj.balance
      }
    });
  }

  async updateBalanceAndCreateTransaction({
    userId,
    amount,
    notes,
    kind
  }: {
    userId: string;
    amount: number;
    notes: string;
    kind: TransactionKindEnum;
  }) {
    if (amount === 0) {
      throw new BadRequestException("Amount can't be zero");
    }
    notes = notes.trim();

    if (!notes) {
      throw new BadRequestException('notes cannot be empty');
    }

    const wallet = await this.getByUserId(userId);
    if (wallet.balance + amount < 0) {
      new BadRequestException('Insufficient credits balance');
    }

    await this.updateBalance(wallet._id, amount);
    this.eventEmitter.emit(EventDomainEnum.TRANSACTION, {
      action: EventActionEnum.CREATE,
      data: {
        event: `${EventDomainEnum.TRANSACTION}.${EventActionEnum.CREATE}`,
        userId,
        amount,
        notes,
        kind
      }
    });
    return true;
  }

  async debitBalanceByUserId({
    userId,
    amount,
    notes,
    kind = TransactionKindEnum.WALLET
  }: {
    userId: string;
    amount: number;
    notes: string;
    kind?: TransactionKindEnum;
  }): Promise<void> {
    assert(amount > 0, new BadRequestException('Invalid amount'));
    await this.updateBalanceAndCreateTransaction({
      userId,
      amount: -amount,
      notes,
      kind
    });
  }

  async creditBalanceByUserId({
    userId,
    amount,
    notes,
    kind = TransactionKindEnum.WALLET
  }: {
    userId: string;
    amount: number;
    notes: string;
    kind?: TransactionKindEnum;
  }): Promise<void> {
    assert(amount > 0, new BadRequestException('Invalid amount'));
    await this.updateBalanceAndCreateTransaction({
      userId,
      amount,
      notes,
      kind
    });
  }
}
