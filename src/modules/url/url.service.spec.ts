import { Test, TestingModule } from '@nestjs/testing';
import { UrlService } from './url.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { DatabaseService } from 'src/services/database/database.service';
import { IdGeneratorService } from 'src/services/id-generator/id-generator.service';
import { TypedConfigService } from 'src/config/typed-config.service';
import { RedisService } from 'src/services/redis/redis.service';
import { IpSafetyService } from 'src/services/ip-safety/ip-safety.service';
import { CreateUrlDto } from './dto/create-url.dto';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Url } from 'src/services/database/generated/prisma/client';
import { isPrismaUniqueConstraintError } from 'src/helpers/prisma/prisma-unique-constraint';
import { buildSearchClause } from 'src/helpers/pagination/build-search-clause';
import { paginate } from 'src/helpers/pagination/paginate';
import { generatePaginationLinks } from 'src/helpers/pagination/generate-pagination-links';

jest.mock('src/helpers/prisma/prisma-unique-constraint', () => ({
  isPrismaUniqueConstraintError: jest.fn(),
}));
jest.mock('src/helpers/pagination/build-search-clause', () => ({
  buildSearchClause: jest.fn(),
}));
jest.mock('src/helpers/pagination/paginate', () => ({
  paginate: jest.fn(),
}));
jest.mock('src/helpers/pagination/generate-pagination-links', () => ({
  generatePaginationLinks: jest.fn(),
}));

describe('UrlService', () => {
  let urlService: UrlService;

  let db: DeepMockProxy<DatabaseService>;
  let idGenerator: DeepMockProxy<IdGeneratorService>;
  let config: DeepMockProxy<TypedConfigService>;
  let redis: DeepMockProxy<RedisService>;
  let ipSafetyService: DeepMockProxy<IpSafetyService>;

  beforeEach(async () => {
    db = mockDeep<DatabaseService>();
    idGenerator = mockDeep<IdGeneratorService>();
    config = mockDeep<TypedConfigService>();
    redis = mockDeep<RedisService>();
    ipSafetyService = mockDeep<IpSafetyService>();

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
        {
          provide: IpSafetyService,
          useValue: ipSafetyService,
        },
      ],
    }).compile();

    urlService = module.get<UrlService>(UrlService);
  });

  describe('create()', () => {
    it('should create url', async () => {
      ipSafetyService.isPrivateIp.mockResolvedValue(false);
      config.get.mockReturnValueOnce(1).mockReturnValueOnce(5);
      idGenerator.generate.mockReturnValue('newurl');
      const createUrlDto: CreateUrlDto = {
        redirect: 'redirect',
        title: 'nyaa',
      };
      const tokenId = 'id';
      const dbEntry = {
        tokenId,
        url: 'newurl',
        ...createUrlDto,
      } as Url;
      db.url.create.mockResolvedValue(dbEntry);
      const result = await urlService.create(createUrlDto, tokenId);
      expect(db.url.create).toHaveBeenCalled();
      expect(result).toBe(dbEntry);
    });

    it('should return bad request if ip is private', async () => {
      ipSafetyService.isPrivateIp.mockResolvedValue(true);
      const createUrlDto = {} as CreateUrlDto;
      await expect(urlService.create(createUrlDto, 'id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return internal server error when url generation attempt over limit', async () => {
      ipSafetyService.isPrivateIp.mockResolvedValue(false);
      const createUrlDto = {} as CreateUrlDto;
      config.get.mockReturnValueOnce(0);
      await expect(urlService.create(createUrlDto, 'id')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should create url after one retry', async () => {
      ipSafetyService.isPrivateIp.mockResolvedValue(false);
      config.get.mockReturnValueOnce(2).mockReturnValueOnce(5);
      idGenerator.generate
        .mockReturnValueOnce('url1')
        .mockReturnValueOnce('url2');
      const createUrlDto: CreateUrlDto = {
        redirect: 'redirect',
        title: 'nyaa',
      };
      const tokenId = 'id';
      const dbEntry = {
        tokenId,
        url: 'url2',
        ...createUrlDto,
      } as Url;
      (isPrismaUniqueConstraintError as jest.Mock).mockReturnValueOnce(true);
      db.url.create
        .mockRejectedValueOnce(new Error('duplicate'))
        .mockResolvedValueOnce(dbEntry);
      const result = await urlService.create(createUrlDto, tokenId);
      expect(db.url.create).toHaveBeenCalledTimes(2);
      expect(result).toBe(dbEntry);
    });

    it('should rethrow if db throws unknown error', async () => {
      ipSafetyService.isPrivateIp.mockResolvedValue(false);
      config.get.mockReturnValueOnce(2).mockReturnValueOnce(5);
      idGenerator.generate
        .mockReturnValueOnce('url1')
        .mockReturnValueOnce('url2');
      const createUrlDto: CreateUrlDto = {
        redirect: 'redirect',
        title: 'nyaa',
      };
      const tokenId = 'id';
      (isPrismaUniqueConstraintError as jest.Mock).mockReturnValueOnce(false);
      db.url.create.mockRejectedValueOnce(new Error('db down'));
      await expect(urlService.create(createUrlDto, tokenId)).rejects.toThrow(
        'db down',
      );
    });
  });

  describe('findAll()', () => {
    it('should return paginated urls without filter', async () => {
      (buildSearchClause as jest.Mock).mockReturnValue(undefined);

      (paginate as jest.Mock).mockReturnValue();
      (generatePaginationLinks as jest.Mock).mockReturnValue();
    });
  });

  describe('findOne()', () => {
    it('should return value from db when url exists', async () => {
      const url = { url: 'url', tokenId: 'token' } as Url;
      db.url.findUnique.mockResolvedValue(url);
      const result = await urlService.findOne('url', 'token');
      expect(result).toBe(url);
      expect(db.url.findUnique).toHaveBeenCalled();
    });

    it('should throw not found when no url with id', async () => {
      db.url.findUnique.mockResolvedValue(null);
      await expect(urlService.findOne('url', 'token')).rejects.toThrow(
        NotFoundException,
      );
      expect(db.url.findUnique).toHaveBeenCalled();
    });
  });
});
