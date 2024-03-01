import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoLoaderService } from 'src/common/redis/abstract/mongo.loader.service';
import { RedisService } from 'src/common/redis/redis.service';
import { Client } from '../client.schema';

@Injectable()
export class ClientLoaderService extends MongoLoaderService<Client> {
  constructor(
    @InjectModel(Client.name)
    protected model: Model<Client>,
    redisService: RedisService,
    configService: ConfigService
  ) {
    const _cacheKey = configService.get('cache.client.key');
    const _ttl = configService.get('cache.client.ttl');
    super(model, redisService, _cacheKey, _ttl);
  }
}
