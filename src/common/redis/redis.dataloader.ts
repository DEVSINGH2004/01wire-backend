import * as DataLoader from 'dataloader';
import { RedisClientType } from 'redis';

export type RedisDataloaderSerializeFn = (data: unknown) => Promise<string>;
export type RedisDataloaderDeserializeFn<V> = (data: string) => Promise<V>;
type CacheKeyFn = (key: any) => string;

type DataLoaderOptions<V> = DataLoader.Options<string, V>;

export interface RedisDataLoaderOptions<V> {
  expire: number;
  serialize: RedisDataloaderSerializeFn;
  deserialize: RedisDataloaderDeserializeFn<V>;
  cacheKeyFn?: CacheKeyFn;
}

const makeKey = (keySpace: string, key: string, cacheKeyFn: any) =>
  `${keySpace ? keySpace + ':' : ''}${cacheKeyFn(key)}`;

const isObject = (value: unknown) => {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
};

export class RedisDataLoader<V> {
  private _opts: RedisDataLoaderOptions<V> & DataLoaderOptions<V>;
  private _keySpace: string;
  private _loader: DataLoader<string, V>;
  private _redis: RedisProxy<V>;

  constructor(
    prefix: string,
    userLoader: DataLoader<string, V>,
    opts: RedisDataLoaderOptions<V> & DataLoaderOptions<V>,
    redis: RedisClientType
  ) {
    this._opts = opts;
    this._opts.cacheKeyFn =
      this._opts.cacheKeyFn ||
      ((k: any) => (isObject(k) ? JSON.stringify(k) : k));
    this._keySpace = prefix;
    this._redis = new RedisProxy<V>(redis, {
      cacheKeyFn: <K>(key: string) => {
        return makeKey(this._keySpace, key, this._opts.cacheKeyFn) as K;
      },
      serialize: this._opts.serialize,
      deserialize: this._opts.deserialize
    });
    this._loader = new DataLoader<string, V>(
      async (keys) => {
        const values = await this._redis.mGet(keys as string[]);
        return Promise.all(
          values.map(async (value, i) => {
            if (value === null) {
              const loaded = await userLoader.load(keys[i]);
              await this._redis.setEx(keys[i], this._opts.expire, loaded);
              return loaded;
            }
            return value;
          })
        );
      },
      {
        ...opts,
        cacheKeyFn: this._opts.cacheKeyFn
      }
    );
  }

  async load(key: string) {
    return this._loader.load(key);
  }

  async loadMany(keys: string[]) {
    return Promise.all(keys.map((key) => this._loader.load(key)));
  }

  async clear(key: string) {
    return this._redis.del(key);
  }

  async clearMany(keys: string[]) {
    return this._redis.delMany(keys);
  }
}

interface RedisProxyOptions<V> {
  serialize: RedisDataloaderSerializeFn;
  deserialize: RedisDataloaderDeserializeFn<V>;
  cacheKeyFn: CacheKeyFn;
}

class RedisProxy<V> {
  private _redis: RedisClientType;
  private _opts: RedisProxyOptions<V>;

  constructor(redis: RedisClientType, options: RedisProxyOptions<V>) {
    this._redis = redis;
    this._opts = options;
  }

  async mGet(keys: string[]): Promise<V[]> {
    const values = await this._redis.mGet(
      keys.map((key) => this._opts.cacheKeyFn(key) as string)
    );
    return Promise.all(
      values.map(async (value) => {
        if (value === null) return value as V;
        return this._opts.deserialize(value);
      })
    );
  }

  async setEx(key: string, seconds: number, value: unknown) {
    key = this._opts.cacheKeyFn(key);
    const serialized = await this._opts.serialize(value);
    await this._redis.setEx(key as string, seconds, serialized);
    return value;
  }

  async del(key: string) {
    key = this._opts.cacheKeyFn(key);
    return this._redis.del(key as string);
  }

  async delMany(keys: string[]) {
    keys = keys.map((key) => this._opts.cacheKeyFn(key));
    return this._redis.del(keys);
  }
}
