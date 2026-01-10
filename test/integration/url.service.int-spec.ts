import { DatabaseService } from '../../src/services/database/database.service';
import { RedisService } from '../../src/services/redis/redis.service';
import { app } from '../setup';
import { UrlService } from '../../src/modules/url/url.service';
import { TokenService } from '../../src/modules/token/token.service';
import { populateUrlsPayload } from '../test-utils';
import { NotFoundException } from '@nestjs/common';
import { Response } from 'express';

describe('UrlService', () => {
  let urlService: UrlService;
  let db: DatabaseService;
  let redis: RedisService;
  let tokenService: TokenService;
  let tokenId: string;

  beforeAll(async () => {
    urlService = app.get(UrlService);
    db = app.get(DatabaseService);
    redis = app.get(RedisService);
  });

  beforeEach(async () => {
    tokenService = app.get(TokenService);
    const token = await tokenService.generateToken();
    tokenId = token.token.split('.')[0] ?? '';
  });

  describe('create()', () => {
    it('should create, store and return new url', async () => {
      const payload = {
        redirect: 'https://google.com',
        title: 'Test link',
        description: 'description',
      };

      const url = await urlService.create(payload, tokenId);
      const dbUrl = await db.url.findUnique({
        where: {
          url: url.url,
        },
      });

      expect(url).toEqual(dbUrl);
    });
  });

  describe('findAll()', () => {
    it('pagination should work properly', async () => {
      const payload = populateUrlsPayload(tokenId);
      await db.url.createMany({ data: payload });

      const urls = await urlService.findAll({ limit: 10, page: 2 }, tokenId);
      expect(urls.data.length).toBe(5);
      expect(urls.meta.totalCount).toBe(15);
      expect(urls.meta.totalPages).toBe(2);
      expect(urls.meta.nextPage).toBeNull();
      expect(urls.meta.previousPage).not.toBeNull();
    });

    it('filtering should filter', async () => {
      const payload = populateUrlsPayload(tokenId);
      await db.url.createMany({ data: payload });

      const urls = await urlService.findAll(
        { limit: 10, page: 1, filter: 'google' },
        tokenId,
      );
      expect(urls.data.length).toBe(8);
      expect(urls.meta.totalCount).toBe(8);
      expect(urls.meta.totalPages).toBe(1);
      expect(urls.meta.nextPage).toBeNull();
      expect(urls.meta.previousPage).toBeNull();
    });

    it('tokens must be isolated', async () => {
      const payload = populateUrlsPayload(tokenId);
      await db.url.createMany({ data: payload });

      const newToken = await tokenService.generateToken();
      const newTokenId = newToken.token.split('.')[0] ?? '';
      const urls = await urlService.findAll({ limit: 10, page: 1 }, newTokenId);
      expect(urls.data.length).toBe(0);
      expect(urls.meta.totalCount).toBe(0);
      expect(urls.meta.totalPages).toBe(0);
      expect(urls.meta.nextPage).toBeNull();
      expect(urls.meta.previousPage).toBeNull();
    });
  });

  describe('findOne()', () => {
    it('should find the url in db', async () => {
      const newUrl = await db.url.create({
        data: {
          redirect: 'https://google.com',
          title: 'google',
          url: 'abc',
          tokenId,
        },
      });

      const url = await urlService.findOne('abc', tokenId);
      expect(url).toStrictEqual(newUrl);
    });

    it('should throw not found with isolated token', async () => {
      const newToken = await tokenService.generateToken();
      const newTokenId = newToken.token.split('.')[0] ?? '';
      const newUrl = await db.url.create({
        data: {
          redirect: 'https://google.com',
          title: 'google',
          url: 'abc',
          tokenId: newTokenId,
        },
      });

      await expect(urlService.findOne('abc', tokenId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('redirect()', () => {
    it('should get record from db if cache miss', async () => {
      const redirectLink = 'https://google.com';
      const newUrl = await db.url.create({
        data: {
          redirect: redirectLink,
          title: 'google',
          url: 'abc',
          tokenId,
        },
      });
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;

      await urlService.redirect('abc', res);
      const cache = await redis.getJSON('redirect:abc');
      expect(cache).toStrictEqual({
        redirect: redirectLink,
      });
      expect(res.redirect).toHaveBeenCalledWith(redirectLink);
    });

    it('should get record from redis instead of db if cache hit', async () => {
      const redirectLink = 'https://youtube.com';
      await redis.setJSON('redirect:abc', { redirect: redirectLink });
      const newUrl = await db.url.create({
        data: {
          redirect: 'https://google.com',
          title: 'google',
          url: 'abc',
          tokenId,
        },
      });
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;

      await urlService.redirect('abc', res);
      const cache = await redis.getJSON('redirect:abc');
      expect(cache).toStrictEqual({
        redirect: redirectLink,
      });
      expect(res.redirect).toHaveBeenCalledWith(redirectLink);
    });

    it('counter value should increase in both scenarios', async () => {
      await db.url.create({
        data: {
          redirect: 'https://google.com',
          title: 'google',
          url: 'abc',
          tokenId,
        },
      });
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;

      await urlService.redirect('abc', res);
      await urlService.redirect('abc', res);
      const clicks = await redis.client.get('clicks:abc');
      expect(clicks).toBe('2');
    });
  });

  describe('update()', () => {
    it('should update the url and invalidate cache', async () => {
      const youtube = 'https://youtube.com';
      const google = 'https://google.com';
      await db.url.create({
        data: {
          redirect: google,
          title: 'google',
          url: 'abc',
          tokenId,
        },
      });
      await redis.setJSON('redirect:abc', { redirect: google });
      const updateDto = {
        redirect: youtube,
        title: 'youtube',
      };
      const updatedUrl = await urlService.update('abc', updateDto, tokenId);
      expect(updatedUrl).not.toBeNull();
      expect(updatedUrl.redirect).toBe(youtube);
      const cache = await redis.getJSON('redirect:abc');
      expect(cache).toBeUndefined();
      const dbUrl = await db.url.findUnique({
        where: {
          url: 'abc',
        },
      });
      expect(dbUrl).toStrictEqual(updatedUrl);
    });
  });

  describe('remove()', () => {
    it('should remove the db record and cached values', async () => {
      await db.url.create({
        data: {
          redirect: 'https://google.com',
          title: 'google',
          url: 'abc',
          tokenId,
        },
      });
      await redis.setJSON('redirect:abc', { redirect: 'https://google.com' });
      await redis.client.set('clicks:abc', 15);

      await urlService.remove('abc', tokenId);
      const redirect = await redis.getJSON('redirect:abc');
      const clicks = await redis.getJSON('clicks:abc');
      expect(redirect).toBeUndefined();
      expect(clicks).toBeUndefined();
      const dbUrl = await db.url.findUnique({
        where: {
          url: 'abc',
        },
      });
      expect(dbUrl).toBeNull();
    });
  });
});
