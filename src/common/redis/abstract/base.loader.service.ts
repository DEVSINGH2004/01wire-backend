import * as DataLoader from 'dataloader';
import {
  RedisDataLoader,
  RedisDataloaderDeserializeFn
} from 'src/common/redis/redis.dataloader';
import { RedisService } from 'src/common/redis/redis.service';

export abstract class BaseLoaderService<V> {
  constructor(
    private redisService: RedisService,
    private _cacheKey: string,
    private _ttl: number
  ) {}

  private _serialize = async (data: unknown) => {
    return JSON.stringify(data);
  };

  protected abstract _deserialize: RedisDataloaderDeserializeFn<V>;
  protected abstract _dbFallback(
    keys: any,
    query: Record<string, any>
  ): Promise<V[]>;

  async init(query?: Record<string, any> | null) {
    let prefix = null;
    typeof query === 'object' && query !== null
      ? (prefix = JSON.stringify(query))
      : (query = {});
    const loader = new RedisDataLoader(
      (!!prefix ? prefix + ':' : '') + this._cacheKey,
      new DataLoader((keys) => this._dbFallback(keys, query), { cache: false }),
      {
        cache: true,
        expire: this._ttl,
        serialize: this._serialize,
        deserialize: this._deserialize
      },
      this.redisService.client
    );
    return loader;
  }

  async cleanCacheById(id: string) {
    return this.redisService.cleanCache(`${this._cacheKey}:${id}`);
  }

  async cleanCacheByIds(ids: string[]) {
    return ids.forEach((id) =>
      this.redisService.cleanCache(`${this._cacheKey}:${id}`)
    );
  }
}
