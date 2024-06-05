import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoLoaderService } from 'src/common/redis/abstract/mongo.loader.service';
import { RedisService } from 'src/common/redis/redis.service';
import { Estimate } from '../estimate.schema';

@Injectable()
export class EstimateLoaderService extends MongoLoaderService<Estimate> {
  constructor(
    @InjectModel(Estimate.name)
    protected model: Model<Estimate>,
    redisService: RedisService,
    configService: ConfigService
  ) {
    const _cacheKey = configService.get('cache.estimate.key');
    const _ttl = configService.get('cache.estimate.ttl');
    super(model, redisService, _cacheKey, _ttl);
  }
}
