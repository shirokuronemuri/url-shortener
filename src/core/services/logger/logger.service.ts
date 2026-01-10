import { Injectable, LoggerService as NestLogger } from '@nestjs/common';
import { TypedConfigService } from 'src/config/typed-config.service';
import winston from 'winston';

@Injectable()
export class LoggerService implements NestLogger {
  private logger: winston.Logger;
  constructor(private readonly config: TypedConfigService) {
    const isDevelopmentEnv = config.get('app.environment') === 'development';

    const { timestamp, json, colorize, combine, printf } = winston.format;

    const logFormat = isDevelopmentEnv
      ? combine(
          colorize({ all: true }),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          printf((info) => {
            const { timestamp, level, context, message, meta } = info as {
              timestamp: string;
              level: string;
              context: string;
              message: string;
              meta: unknown;
            };
            return `${timestamp} ${level} [${context}] ${message} ${meta ? JSON.stringify(meta) : ''}`;
          }),
        )
      : combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json());

    this.logger = winston.createLogger({
      format: logFormat,
      silent: config.get('app.environment') === 'test',
      transports: [new winston.transports.Console()],
    });
  }

  log(message: string, context?: string, meta?: unknown) {
    this.logger.info(message, {
      context: context ?? 'App',
      meta,
    });
  }

  warn(message: string, context?: string, meta?: unknown) {
    this.logger.info(message, {
      context: context ?? 'App',
      meta,
    });
  }

  error(message: string, trace?: string, context?: string, meta?: unknown) {
    this.logger.info(message, {
      trace,
      context: context ?? 'App',
      meta,
    });
  }
}
