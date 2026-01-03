import { Test, type TestingModule } from '@nestjs/testing';
import { TestService } from './test.service';
import { DatabaseService } from 'src/services/database/database.service';
import { mockDeep } from 'jest-mock-extended';
import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';

describe('TestService', () => {
  let testService: TestService;

  beforeEach(async () => {
    const cacheStore = new Map<string, unknown>();
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        TestService,
        {
          provide: DatabaseService,
          useValue: mockDeep<DatabaseService>(),
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: (key: string) => cacheStore.get(key),
            set: (key: string, value: string) => cacheStore.set(key, value),
          },
        },
      ],
    }).compile();

    testService = app.get<TestService>(TestService);
  });

  describe('root', () => {
    it('should return uncached value if using function first time', async () => {
      const result = await testService.test();
      expect(result).toBe('Put in cache!');
    });
    it('should return cached value if using function twice', async () => {
      await testService.test();
      const result = await testService.test();
      expect(result).toBe('Got from cache!');
    });
  });
});
