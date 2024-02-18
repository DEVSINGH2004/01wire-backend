import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoLoaderService } from 'src/common/redis/abstract/mongo.loader.service';
import { RedisService } from 'src/common/redis/redis.service';
import { Article } from '../article.schema';

@Injectable()
export class ArticleLoaderService extends MongoLoaderService<Article> {
  constructor(
    @InjectModel(Article.name)
    protected model: Model<Article>,
    redisService: RedisService,
    configService: ConfigService
  ) {
    const _cacheKey = configService.get('cache.article.key');
    const _ttl = configService.get('cache.article.ttl');
    super(model, redisService, _cacheKey, _ttl);
  }
}
