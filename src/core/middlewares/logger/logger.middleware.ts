import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response } from 'express';
import { LoggerService } from 'src/core/services/logger/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}
  use(req: Request, res: Response, next: () => void) {
    res.on('finish', () => {
      const message = `${req.method} ${req.url}`;
      if (res.statusCode >= 500) {
        this.logger.error(message, undefined, 'HTTP');
      } else if (res.statusCode >= 400) {
        this.logger.warn(message, 'HTTP');
      } else {
        this.logger.log(message, 'HTTP');
      }
    });
    next();
  }
}
