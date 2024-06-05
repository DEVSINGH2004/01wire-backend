import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoLoaderService } from 'src/common/redis/abstract/mongo.loader.service';
import { RedisService } from 'src/common/redis/redis.service';
import { Order } from '../order.schema';

@Injectable()
export class OrderLoaderService extends MongoLoaderService<Order> {
  constructor(
    @InjectModel(Order.name)
    protected model: Model<Order>,
    redisService: RedisService,
    configService: ConfigService
  ) {
    const _cacheKey = configService.get('cache.order.key');
    const _ttl = configService.get('cache.order.ttl');
    super(model, redisService, _cacheKey, _ttl);
  }
}
