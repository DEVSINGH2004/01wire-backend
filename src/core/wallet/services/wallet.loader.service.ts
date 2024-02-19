import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoLoaderService } from 'src/common/redis/abstract/mongo.loader.service';
import { RedisService } from 'src/common/redis/redis.service';
import { Wallet } from '../wallet.schema';

@Injectable()
export class WalletLoaderService extends MongoLoaderService<Wallet> {
  constructor(
    @InjectModel(Wallet.name)
    protected model: Model<Wallet>,
    redisService: RedisService,
    configService: ConfigService
  ) {
    const _cacheKey = configService.get('cache.wallet.key');
    const _ttl = configService.get('cache.wallet.ttl');
    super(model, redisService, _cacheKey, _ttl);
  }
}
