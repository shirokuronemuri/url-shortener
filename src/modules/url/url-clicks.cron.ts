import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { LoggerService } from 'src/core/services/logger/logger.service';
import { DatabaseService } from 'src/services/database/database.service';
import { RedisService } from 'src/services/redis/redis.service';

@Injectable()
export class UrlClicksCron implements OnModuleInit {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
    private readonly logger: LoggerService,
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}
  onModuleInit() {
    const schedule = this.config.getOrThrow<string>('cron.flushClicksInterval');
    const job = new CronJob(schedule, async () => {
      await this.flushClicks();
    });
    this.schedulerRegistry.addCronJob('flush-clicks-job', job);
    job.start();
    this.logger.log('flushClicks CRON job started', UrlClicksCron.name);
  }

  async flushClicks() {
    this.logger.log('Executing flushClicks CRON job...', UrlClicksCron.name);
    let cursor = '0';
    const rawKeys: string[] = [];
    do {
      const [next, keys] = await this.redis.client.scan(
        cursor,
        'MATCH',
        'clicks:*',
        'COUNT',
        100,
      );
      rawKeys.push(...keys);
      cursor = next;
    } while (cursor !== '0');
    const urlKeys = rawKeys
      .map((key) => key.split(':')[1])
      .filter((key) => key !== undefined);

    if (urlKeys.length === 0) {
      this.logger.log(
        `flushClicks CRON job execution finished; nothing to flush`,
        UrlClicksCron.name,
      );
      return;
    }

    const pipeline = this.redis.client.pipeline();
    urlKeys.forEach((key) => {
      pipeline.getdel(`clicks:${key}`);
    });
    const stringValues = await pipeline.exec();

    const counterValues = stringValues
      ? stringValues.map(([err, val]) => {
          if (err) {
            this.logger.error(err.message, err.stack, UrlClicksCron.name);
          }
          return val === null || isNaN(Number(val)) ? 0 : Number(val);
        })
      : [];
    const queryValues = urlKeys
      .map((key, i) => ({
        url: key,
        value: counterValues[i],
      }))
      .map((row) => `('${row.url}', ${row.value})`)
      .join(', ');

    // Single operation to avoid race conditions
    const updatedRows = await this.db.$executeRawUnsafe(`
      UPDATE "Url" as u
      SET clicks = u.clicks + v.delta
      FROM (
        VALUES ${queryValues}
      ) AS v(url, delta)
      WHERE u.url = v.url
      `);

    this.logger.log(
      `flushClicks CRON job execution finished; updated ${updatedRows} row counters`,
      UrlClicksCron.name,
    );
  }
}
