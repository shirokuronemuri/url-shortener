import {
  Global,
  Module,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import config from 'src/config';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { HttpExceptionFilter } from './filters/http-exception/http-exception.filter';
import { LoggerService } from './services/logger/logger.service';
import { LoggerMiddleware } from './middlewares/logger/logger.middleware';
import { DatabaseService } from 'src/services/database/database.service';
import { RedisService } from 'src/services/redis/redis.service';
import { RedisProvider } from 'src/services/redis/redis.provider';
import { TypedConfigService } from 'src/config/typed-config.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => ({
        throttlers: [
          {
            name: 'main',
            ttl: 60 * 1000,
            limit: 50,
          },
          {
            name: 'burst',
            ttl: 1000,
            limit: 3,
          },
        ],
        errorMessage: 'Too Many Requests',
        storage: new ThrottlerStorageRedisService(config.get('redis.url')),
      }),
    }),
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    LoggerService,
    DatabaseService,
    RedisProvider,
    RedisService,
    TypedConfigService,
  ],
  exports: [LoggerService, DatabaseService, RedisService, TypedConfigService],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
