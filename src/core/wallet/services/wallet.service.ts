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
    let walletObj = await this.model.findOne({ userId });
    if (walletObj) return walletObj;
    return this.model.create({ userId, balance: 10 });
  }

  async creditBalance(_id: string, amount: number): Promise<void> {
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

  async debitBalanceByUserId(userId: string, amount: number): Promise<void> {
    const walletObj = await this.getByUserId(userId);
    assert(
      walletObj.balance >= amount,
      new BadRequestException('Insufficient credits balance')
    );
    await this.model.updateOne(
      { _id: walletObj._id },
      { $inc: { balance: -amount } }
    );
    await this.loaderService.cleanCacheById(walletObj._id);
    this.eventEmitter.emit(EventDomainEnum.SSE, {
      action: EventActionEnum.SEND,
      data: {
        event: `${EventDomainEnum.WALLET}.${EventActionEnum.UPDATE}`,
        userId: walletObj.userId,
        balance: walletObj.balance - amount
      }
    });
  }
}
