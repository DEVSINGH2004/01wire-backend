import { BaseLoaderService } from './base.loader.service';
import { RedisService } from '../redis.service';
import { Model } from 'mongoose';

export abstract class MongoLoaderService<V> extends BaseLoaderService<V> {
  constructor(
    protected model: Model<V>,
    redisService: RedisService,
    _cacheKey: string,
    _ttl: number
  ) {
    super(redisService, _cacheKey, _ttl);
  }

  protected _deserialize = async (data: string) => {
    const raw = JSON.parse(data as string);
    if (!raw) return null;
    return this.model.hydrate(raw);
  };

  protected async _dbFallback(keys: any, query: Record<string, any>) {
    const objList = await this.model.find({ _id: { $in: keys }, ...query });
    const maxCount = keys.length;
    for (let i = 0; i < maxCount; i++) {
      keys[i] = objList.find((obj) => obj._id === keys[i]) || null;
    }
    return keys;
  }
}
