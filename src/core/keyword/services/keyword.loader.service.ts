import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoLoaderService } from 'src/common/redis/abstract/mongo.loader.service';
import { RedisService } from 'src/common/redis/redis.service';
import { Keyword } from '../keyword.schema';

@Injectable()
export class KeywordLoaderService extends MongoLoaderService<Keyword> {
  constructor(
    @InjectModel(Keyword.name)
    protected model: Model<Keyword>,
    redisService: RedisService,
    configService: ConfigService
  ) {
    const _cacheKey = configService.get('cache.keyword.key');
    const _ttl = configService.get('cache.keyword.ttl');
    super(model, redisService, _cacheKey, _ttl);
  }
}
