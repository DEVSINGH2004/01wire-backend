import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType, createClient } from 'redis';
import { ConfigVariablesType } from '../../config';

@Injectable()
export class RedisService implements OnModuleInit {
  private _logger = new Logger(RedisService.name);
  private _client: RedisClientType;

  constructor(readonly configService: ConfigService<ConfigVariablesType>) {
    const cfg = configService.get('db.redis', { infer: true });
    this._client = createClient(cfg);
    this._client.on('connect', this.handleConnect);
    this._client.on('disconnect', this.handleDisconnect);
    this._client.on('error', this.handleError);
  }

  get client(): RedisClientType {
    return this._client;
  }

  async onModuleInit() {
    await this._client.connect();
  }

  async get(key: string) {
    return this._client.get(key);
  }

  async set(key: string, value: string, ttl: number) {
    return ttl
      ? this._client.setEx(key, ttl, value)
      : this._client.set(key, value);
  }

  // use arrow functions to auto bind `this`
  private handleConnect = () => {
    this._logger.log('REDIS CONNECTED :)');
  };

  private handleDisconnect = () => {
    this._logger.log('REDIS DISCONNECTED :(');
  };

  private handleError = (e: unknown) => {
    this._logger.log('REDIS ERROR :O', e);
  };

  async scanKeys(pattern: string) {
    const keys = new Set<string>();
    let cursor = 0;
    do {
      const reply = await this._client.scan(cursor, {
        MATCH: pattern,
        COUNT: 250
      });
      cursor = reply.cursor;
      reply.keys.forEach((key) => keys.add(key));
    } while (cursor !== 0);
    return keys;
  }

  async getKeys(pattern: string) {
    return this._client.keys(pattern);
  }

  async deleteCache(keys: string[]) {
    return this._client.del(keys);
  }

  async deleteCacheById(prefix: string, id: string) {
    const arr = [prefix + ':' + id];
    await this.deleteCache(arr);
  }

  async cleanCache(_id: string) {
    const keys = await this.scanKeys(`*${_id}*`);
    if (keys.size) {
      await this.deleteCache([...keys]);
    }
  }
}
