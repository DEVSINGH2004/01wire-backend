import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Wallet } from '../wallet.schema';
import { Model } from 'mongoose';
import { WalletLoaderService } from './wallet.loader.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name)
    protected model: Model<Wallet>,
    private loaderService: WalletLoaderService
  ) {}

  async load(id: string, q: Record<string, any> = null): Promise<Wallet> {
    const loader = await this.loaderService.init(q);
    return loader.load(id);
  }

  async loadMany(
    ids: string[],
    q: Record<string, any> = null
  ): Promise<Wallet[]> {
    const loader = await this.loaderService.init(q);
    return loader.loadMany(ids);
  }

  async getByUserId(userId: string) {
    return this.model.findOne({ userId });
  }

  async create(userId: string): Promise<Wallet> {
    let walletObj = await this.model.findOne({ userId });
    if (walletObj) return walletObj;
    return this.model.create({ userId });
  }
}
