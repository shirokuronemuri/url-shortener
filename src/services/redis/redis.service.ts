import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { LoggerService } from 'src/core/services/logger/logger.service';
import { REDIS_CLIENT } from './redis.provider';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CLIENT) public readonly client: Redis,
    private readonly logger: LoggerService,
  ) {}

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Stringify value and store it by key
   * @param key key
   * @param value value
   * @param ttl Time to live in seconds
   */
  async setJSON(key: string, value: unknown, ttl?: number) {
    let stringValue;
    try {
      stringValue = JSON.stringify(value);
    } catch (e) {
      this.logger.error(
        'Failed stringifying the value',
        e instanceof Error ? e.message : undefined,
        RedisService.name,
        value,
      );
    }
    if (stringValue) {
      if (ttl) {
        await this.client.set(key, stringValue, 'EX', ttl);
      } else {
        await this.client.set(key, stringValue);
      }
    }
  }

  /**
   * Get and parse value stored in a key
   * @param key key
   * @returns Parsed value if it's present or undefined
   */
  async getJSON<T = unknown>(key: string): Promise<T | undefined> {
    const stringValue = await this.client.get(key);
    if (stringValue) {
      try {
        const value = JSON.parse(stringValue) as T;
        return value;
      } catch (e) {
        this.logger.error(
          'Failed parsing the value stored in Redis',
          e instanceof Error ? e.message : undefined,
          RedisService.name,
          stringValue,
        );
      }
    }
  }
}
