import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoLoaderService } from 'src/common/redis/abstract/mongo.loader.service';
import { RedisService } from 'src/common/redis/redis.service';
import { Coupon } from '../coupon.schema';
@Injectable()
export class CouponLoaderService extends MongoLoaderService<Coupon> {
  constructor(
    @InjectModel(Coupon.name)
    protected model: Model<Coupon>,
    redisService: RedisService,
    configService: ConfigService
  ) {
    const _cacheKey = configService.get('cache.coupon.key');
    const _ttl = configService.get('cache.coupon.ttl');
    super(model, redisService, _cacheKey, _ttl);
  }
}
