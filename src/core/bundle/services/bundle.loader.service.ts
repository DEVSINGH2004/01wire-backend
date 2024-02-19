import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoLoaderService } from 'src/common/redis/abstract/mongo.loader.service';
import { RedisService } from 'src/common/redis/redis.service';
import { Bundle } from '../bundle.schema';

@Injectable()
export class BundleLoaderService extends MongoLoaderService<Bundle> {
  constructor(
    @InjectModel(Bundle.name)
    protected model: Model<Bundle>,
    redisService: RedisService,
    configService: ConfigService
  ) {
    const _cacheKey = configService.get('cache.bundle.key');
    const _ttl = configService.get('cache.bundle.ttl');
    super(model, redisService, _cacheKey, _ttl);
  }
}
