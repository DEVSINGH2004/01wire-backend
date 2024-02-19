import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoLoaderService } from 'src/common/redis/abstract/mongo.loader.service';
import { RedisService } from 'src/common/redis/redis.service';
import { Product } from '../product.schema';

@Injectable()
export class ProductLoaderService extends MongoLoaderService<Product> {
  constructor(
    @InjectModel(Product.name)
    protected model: Model<Product>,
    redisService: RedisService,
    configService: ConfigService
  ) {
    const _cacheKey = configService.get('cache.product.key');
    const _ttl = configService.get('cache.product.ttl');
    super(model, redisService, _cacheKey, _ttl);
  }
}
