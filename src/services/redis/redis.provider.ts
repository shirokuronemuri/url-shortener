import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { TypedConfigService } from 'src/config/typed-config.service';
import { LoggerService } from 'src/core/services/logger/logger.service';
export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [TypedConfigService, LoggerService],
  useFactory: (config: TypedConfigService, logger: LoggerService) => {
    const client = new Redis(config.get('redis.url'), {});
    client.on('connect', () =>
      logger.log('Connected to Redis!', 'RedisProvider'),
    );
    client.on('ready', () =>
      logger.log('Redis ready to accept commands', 'RedisProvider'),
    );
    client.on('error', (err) => {
      logger.error('Redis connection failed', err.stack, 'RedisProvider');
      if (config.get('app.environment') === 'test') {
        process.exit(1);
      }
    });

    return client;
  },
};
