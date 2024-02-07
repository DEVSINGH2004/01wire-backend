import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoLoaderService } from 'src/common/redis/abstract/mongo.loader.service';
import { RedisService } from 'src/common/redis/redis.service';
import { User } from '../user.schema';

@Injectable()
export class UserLoaderService extends MongoLoaderService<User> {
  constructor(
    @InjectModel(User.name)
    protected model: Model<User>,
    redisService: RedisService,
    configService: ConfigService
  ) {
    const _cacheKey = configService.get('cache.user.key');
    const _ttl = configService.get('cache.user.ttl');
    super(model, redisService, _cacheKey, _ttl);
  }
}
