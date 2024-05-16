import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoLoaderService } from 'src/common/redis/abstract/mongo.loader.service';
import { RedisService } from 'src/common/redis/redis.service';
import { Pr } from '../pr.schema';

@Injectable()
export class PrLoaderService extends MongoLoaderService<Pr> {
  constructor(
    @InjectModel(Pr.name)
    protected model: Model<Pr>,
    redisService: RedisService,
    configService: ConfigService
  ) {
    const _cacheKey = configService.get('cache.pr.key');
    const _ttl = configService.get('cache.pr.ttl');
    super(model, redisService, _cacheKey, _ttl);
  }
}
