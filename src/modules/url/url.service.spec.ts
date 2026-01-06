import { Test, TestingModule } from '@nestjs/testing';
import { UrlService } from './url.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { DatabaseService } from 'src/services/database/database.service';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';
import { TypedConfigService } from 'src/config/typed-config.service';
import { RedisService } from 'src/services/redis/redis.service';

describe('UrlService', () => {
  let urlService: UrlService;

  let db: DeepMockProxy<DatabaseService>;
  let idGenerator: DeepMockProxy<IdGeneratorService>;
  let config: DeepMockProxy<TypedConfigService>;
  let redis: DeepMockProxy<RedisService>;

  beforeEach(async () => {
    db = mockDeep<DatabaseService>();
    idGenerator = mockDeep<IdGeneratorService>();
    config = mockDeep<TypedConfigService>();
    redis = mockDeep<RedisService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlService,
        {
          provide: DatabaseService,
          useValue: db,
        },
        {
          provide: IdGeneratorService,
          useValue: idGenerator,
        },
        {
          provide: TypedConfigService,
          useValue: config,
        },
        {
          provide: RedisService,
          useValue: redis,
        },
      ],
    }).compile();

    urlService = module.get<UrlService>(UrlService);
  });

  it('should be defined', () => {});
});
