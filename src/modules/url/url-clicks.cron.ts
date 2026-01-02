import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LoggerService } from 'src/core/services/logger/logger.service';
import { DatabaseService } from 'src/database/database.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class UrlClicksCron {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
    private readonly logger: LoggerService,
  ) {}
  @Cron('*/15 * * * * *')
  async flushClicks() {
    this.logger.log('Executing flushClicks CRON job...', UrlClicksCron.name);
    const urlKeys = (
      await this.redis.client.scan(0, 'MATCH', 'clicks:*', 'COUNT', 100)
    )[1]
      .map((key) => key.split(':')[1])
      .filter((key) => key !== undefined);
    const pipeline = this.redis.client.pipeline();
    urlKeys.forEach((key) => {
      pipeline.getdel(key);
    });
    const values = await pipeline.exec();

    if (!values) {
      return;
    }
    // todo map values and output errors
    // todo write executeraw script
  }
}
