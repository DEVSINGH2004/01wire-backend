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
import { MAX_NOTES } from 'src/common/dto/text.limits';

const SIGNUP_BONUS_CREDITS = 10;

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
    // Start at 0 and add the signup credits as a real ledger entry, so every
    // credit in a wallet has a matching transaction
    const newWallet = await this.model.create({ userId, balance: 0 });
    await this.creditBalanceByUserId({
      userId,
      amount: SIGNUP_BONUS_CREDITS,
      notes: 'Signup bonus'
    });
    return this.model.findOne({ _id: newWallet._id });
  }

  async updateBalance(_id: string, amount: number): Promise<void> {
    // Debits only apply if the balance covers them; the check and the $inc are
    // one atomic operation, so concurrent debits can't overdraw the wallet
    const filter = amount < 0 ? { _id, balance: { $gte: -amount } } : { _id };
    const res = await this.model.updateOne(filter, {
      $inc: { balance: amount }
    });
    assert(
      res.modifiedCount === 1,
      new BadRequestException('Insufficient credits balance')
    );
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
    kind,
    performedBy = null
  }: {
    userId: string;
    amount: number;
    notes: string;
    kind: TransactionKindEnum;
    performedBy?: string;
  }) {
    if (amount === 0) {
      throw new BadRequestException("Amount can't be zero");
    }
    notes = notes.trim();

    if (!notes) {
      throw new BadRequestException('notes cannot be empty');
    }
    // Checked before the balance changes: the transaction record is written
    // afterwards and would otherwise fail validation silently
    assert(
      notes.length <= MAX_NOTES,
      new BadRequestException(`notes must be at most ${MAX_NOTES} characters`)
    );

    const wallet = await this.getByUserId(userId);
    assert(!!wallet, new BadRequestException('wallet not found'));

    await this.updateBalance(wallet._id, amount);
    this.eventEmitter.emit(EventDomainEnum.TRANSACTION, {
      action: EventActionEnum.CREATE,
      data: {
        event: `${EventDomainEnum.TRANSACTION}.${EventActionEnum.CREATE}`,
        userId,
        amount,
        notes,
        kind,
        performedBy
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
