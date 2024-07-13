import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Wallet } from '../wallet.schema';
import { Model } from 'mongoose';
import { WalletLoaderService } from './wallet.loader.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventDomainEnum } from 'src/core/events/enum/event.domain.enum';
import { EventActionEnum } from 'src/core/events/enum/event.action.enum';
import * as assert from 'assert';

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
    notes
  }: {
    userId: string;
    amount: number;
    notes: string;
  }) {
    if (amount === 0) {
      throw new BadRequestException("Amount can't be zero");
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
        notes
      }
    });
    return true;
  }

  async debitBalanceByUserId(userId: string, amount: number): Promise<void> {
    assert(amount > 0, new BadRequestException('Invalid amount'));
    await this.updateBalanceAndCreateTransaction({
      userId,
      amount: -amount,
      notes: '' //TODO: Check what note to add
    });
  }

  async creditBalanceByUserId(userId: string, amount: number): Promise<void> {
    assert(amount > 0, new BadRequestException('Invalid amount'));
    await this.updateBalanceAndCreateTransaction({
      userId,
      amount,
      notes: '' //TODO: Check what note to add
    });
  }
}
