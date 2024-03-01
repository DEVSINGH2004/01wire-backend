import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoLoaderService } from 'src/common/redis/abstract/mongo.loader.service';
import { RedisService } from 'src/common/redis/redis.service';
import { Publication } from '../publication.schema';

@Injectable()
export class PublicationLoaderService extends MongoLoaderService<Publication> {
  constructor(
    @InjectModel(Publication.name)
    protected model: Model<Publication>,
    redisService: RedisService,
    configService: ConfigService
  ) {
    const _cacheKey = configService.get('cache.publication.key');
    const _ttl = configService.get('cache.publication.ttl');
    super(model, redisService, _cacheKey, _ttl);
  }
}
