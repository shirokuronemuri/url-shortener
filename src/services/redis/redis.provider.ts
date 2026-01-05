import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { TypedConfigService } from 'src/config/typed-config.service';
export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [TypedConfigService],
  useFactory: (config: TypedConfigService) => {
    return new Redis(config.get('redis.url'), {});
  },
};
