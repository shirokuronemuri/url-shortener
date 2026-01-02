import {
  Global,
  Module,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import config from 'src/config';
import { TransformResponseInterceptor } from './interceptors/transform-response/transform-response.interceptor';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { HttpExceptionFilter } from './filters/http-exception/http-exception.filter';
import { LoggerService } from './services/logger/logger.service';
import { LoggerMiddleware } from './middlewares/logger/logger.middleware';
import { DatabaseService } from 'src/database/database.service';
import { RedisService } from 'src/redis/redis.service';
import { RedisProvider } from 'src/redis/redis.provider';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
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
  ],
  exports: [LoggerService, DatabaseService, RedisService],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
