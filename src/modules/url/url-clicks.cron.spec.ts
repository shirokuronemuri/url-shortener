import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { UrlClicksCron } from './url-clicks.cron';
import { DatabaseService } from 'src/services/database/database.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { RedisService } from 'src/services/redis/redis.service';
import { TypedConfigService } from 'src/config/typed-config.service';
import { LoggerService } from 'src/core/services/logger/logger.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('UrlClicksCron', () => {
  let cronService: UrlClicksCron;

  let db: DeepMockProxy<DatabaseService>;
  let config: DeepMockProxy<TypedConfigService>;
  let logger: DeepMockProxy<LoggerService>;
  let redis: DeepMockProxy<RedisService>;
  let schedulerRegistry: DeepMockProxy<SchedulerRegistry>;

  beforeEach(async () => {
    db = mockDeep<DatabaseService>();
    config = mockDeep<TypedConfigService>();
    logger = mockDeep<LoggerService>();
    redis = mockDeep<RedisService>();
    schedulerRegistry = mockDeep<SchedulerRegistry>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlClicksCron,
        {
          provide: DatabaseService,
          useValue: db,
        },
        {
          provide: LoggerService,
          useValue: logger,
        },
        {
          provide: TypedConfigService,
          useValue: config,
        },
        {
          provide: RedisService,
          useValue: redis,
        },
        {
          provide: SchedulerRegistry,
          useValue: schedulerRegistry,
        },
      ],
    }).compile();

    cronService = module.get<UrlClicksCron>(UrlClicksCron);
  });

  describe('onModuleInit()', () => {
    it('registers and starts the job', () => {
      config.get.mockReturnValue('* * * * *');

      cronService.onModuleInit();

      const [jobName, jobInstance] =
        schedulerRegistry.addCronJob.mock.calls[0]!;
      expect(jobName).toBe('flush-clicks-job');
      expect(jobInstance.isActive).toBe(true);
      expect(logger.log).toHaveBeenCalled();

      jobInstance.stop();
    });
  });

  describe('flushClicks()', () => {
    it('does nothing when no keys found to flush', async () => {
      redis.client.scan.mockResolvedValue(['0', []]);
      await cronService.flushClicks();

      expect(redis.client.pipeline).not.toHaveBeenCalled();
      expect(db.$executeRawUnsafe).not.toHaveBeenCalled();
    });

    it('flushes the clicks and updates the database', async () => {
      redis.client.scan.mockResolvedValue(['0', ['clicks:abc', 'clicks:cde']]);
      const pipelineMock = {
        getdel: jest.fn().mockReturnThis(),
        exec: jest.fn().mockReturnValue([
          [null, '3'],
          [null, '5'],
        ]),
      };
      redis.client.pipeline.mockReturnValue(pipelineMock as any);
      db.$executeRawUnsafe.mockResolvedValue(2);

      await cronService.flushClicks();

      expect(redis.client.pipeline).toHaveBeenCalled();
      expect(db.$executeRawUnsafe).toHaveBeenCalled();
      const sql = db.$executeRawUnsafe.mock.calls[0]![0];
      expect(sql).toContain("('abc', 3)");
      expect(sql).toContain("('cde', 5)");
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('updated 2 row counters'),
        UrlClicksCron.name,
      );
    });

    it('handles redis errors and invalid values and replaces them with 0', async () => {
      redis.client.scan.mockResolvedValue([
        '0',
        ['clicks:bad1', 'clicks:bad2'],
      ]);
      const redisError = new Error('redis go boom');
      const pipelineMock = {
        getdel: jest.fn().mockReturnThis(),
        exec: jest.fn().mockReturnValue([
          [null, 'invalid'],
          [redisError, null],
        ]),
      };
      redis.client.pipeline.mockReturnValue(pipelineMock as any);
      db.$executeRawUnsafe.mockResolvedValue(0);

      await cronService.flushClicks();

      expect(redis.client.pipeline).toHaveBeenCalled();
      expect(db.$executeRawUnsafe).toHaveBeenCalled();
      const sql = db.$executeRawUnsafe.mock.calls[0]![0];
      expect(sql).toContain("('bad1', 0)");
      expect(sql).toContain("('bad2', 0)");
      expect(logger.error).toHaveBeenCalledWith(
        redisError.message,
        redisError.stack,
        UrlClicksCron.name,
      );
    });
  });
});
