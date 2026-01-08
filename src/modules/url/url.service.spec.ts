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
import { Response } from 'express';

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
    it('should process query and return the data and meta in right format', async () => {
      const tokenId = 'token';
      const query = {
        page: 1,
        limit: 10,
      };
      const urls = [
        { id: 'a', title: 'nya1' },
        { id: 'b', title: 'nya2' },
      ];
      const meta = {
        currentPage: 1,
        limit: 10,
        totalCount: 2,
        totalPages: 1,
      };

      (buildSearchClause as jest.Mock).mockReturnValue({});
      (paginate as jest.Mock).mockImplementation(() => ({
        data: urls,
        meta,
      }));
      const pages = {
        nextPage: null,
        previousPage: null,
      };
      (generatePaginationLinks as jest.Mock).mockReturnValue(pages);
      config.get.mockReturnValue('host');

      const result = await urlService.findAll(query, tokenId);

      expect(buildSearchClause).toHaveBeenCalledWith(undefined, [
        'title',
        'description',
        'redirect',
      ]);
      expect(paginate).toHaveBeenCalledWith(
        expect.objectContaining({
          ...query,
          fetch: expect.any(Function),
          count: expect.any(Function),
        }),
      );
      expect(generatePaginationLinks).toHaveBeenCalledWith({
        host: 'host',
        ...query,
        totalPages: meta.totalPages,
      });
      expect(result).toStrictEqual({
        data: urls,
        meta: {
          ...meta,
          ...pages,
        },
      });
    });

    it('should wire pagination callbacks to db correctly', async () => {
      const tokenId = 'token';
      const query = { page: 1, limit: 10 };
      let capturedFetch!: (args: any) => Promise<any>;
      let capturedCount!: () => Promise<any>;
      (paginate as jest.Mock).mockImplementation(async ({ fetch, count }) => {
        capturedFetch = fetch;
        capturedCount = count;
        return {
          data: [],
          meta: {},
        };
      });

      await urlService.findAll(query, tokenId);
      await capturedFetch({ skip: 0, take: 10 });
      await capturedCount();

      expect(db.url.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { tokenId },
      });
      expect(db.url.count).toHaveBeenCalledWith({ where: { tokenId } });
    });

    it('should pass search clause to db when filter is present', async () => {
      const tokenId = 'token';
      const query = {
        filter: 'filter',
      };
      const searchClause = {
        OR: [{ title: { contains: 'filter', mode: 'insensitive' } }],
      };
      (buildSearchClause as jest.Mock).mockReturnValue(searchClause);
      let capturedFetch!: (args: any) => Promise<any>;
      (paginate as jest.Mock).mockImplementation(async ({ fetch }) => {
        capturedFetch = fetch;
        return {
          data: [],
          meta: {},
        };
      });
      const pages = {
        nextPage: null,
        previousPage: null,
      };
      (generatePaginationLinks as jest.Mock).mockReturnValue(pages);
      config.get.mockReturnValue('host');

      await urlService.findAll(query, tokenId);
      await capturedFetch({ skip: 0, take: 10 });

      expect(buildSearchClause).toHaveBeenCalledWith('filter', [
        'title',
        'description',
        'redirect',
      ]);
      expect(db.url.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { tokenId, ...searchClause },
      });
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

  describe('redirect()', () => {
    it('should redirect without cache and db writes if cache hit', async () => {
      const id = 'id';
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;

      redis.getJSON.mockResolvedValue({ redirect: 'cached-redirect' });
      db.url.findUnique.mockResolvedValue({
        redirect: 'uncached-redirect',
      } as Url);

      await urlService.redirect(id, res);
      expect(redis.client.incr).toHaveBeenCalledWith('clicks:id');
      expect(redis.getJSON).toHaveBeenCalledWith('redirect:id');
      expect(res.redirect).toHaveBeenCalledWith('cached-redirect');
      expect(db.url.findUnique).not.toHaveBeenCalled();
      expect(redis.setJSON).not.toHaveBeenCalled();
    });

    it('should redirect with cache and db write if cache miss', async () => {
      const id = 'id';
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;

      redis.getJSON.mockResolvedValue(undefined);

      db.url.findUnique.mockResolvedValue({
        redirect: 'uncached-redirect',
      } as Url);

      await urlService.redirect(id, res);
      expect(redis.client.incr).toHaveBeenCalledWith('clicks:id');
      expect(redis.getJSON).toHaveBeenCalledWith('redirect:id');
      expect(redis.setJSON).toHaveBeenCalledWith(
        'redirect:id',
        {
          redirect: 'uncached-redirect',
        },
        3600,
      );
      expect(db.url.findUnique).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('uncached-redirect');
    });
  });

  describe('update()', () => {
    it('should throw if redirect is included in dto and ip is private', async () => {
      const id = 'id';
      const tokenId = 'tokenId';
      const dto = { redirect: 'redirect' };
      ipSafetyService.isPrivateIp.mockResolvedValue(true);

      await expect(urlService.update(id, dto, tokenId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update url', async () => {
      const urlId = 'id';
      const tokenId = 'tokenId';
      const dto = { redirect: 'redirect' };
      ipSafetyService.isPrivateIp.mockResolvedValue(false);
      db.url.findUnique.mockResolvedValue({ id: 1, url: urlId } as Url);
      db.url.update.mockResolvedValue({ id: 1, url: urlId, ...dto } as Url);
      const result = await urlService.update(urlId, dto, tokenId);

      expect(result).toStrictEqual({
        id: 1,
        url: urlId,
        ...dto,
      });
      expect(db.url.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          ...dto,
        },
      });
      expect(redis.client.del).toHaveBeenLastCalledWith('redirect:id');
    });
  });

  describe('remove()', () => {
    it('should remove url from db', async () => {
      const urlId = 'id';
      const tokenId = 'tokenId';
      db.url.findUnique.mockResolvedValue({ id: 1 } as Url);

      await urlService.remove(urlId, tokenId);
      expect(db.url.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
      expect(redis.client.del).toHaveBeenCalledWith('redirect:id');
      expect(redis.client.del).toHaveBeenCalledWith('clicks:id');
    });
  });
});
