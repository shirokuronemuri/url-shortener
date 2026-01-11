import { UrlClicksCron } from 'src/modules/url/url-clicks.cron';
import { DatabaseService } from 'src/services/database/database.service';
import { RedisService } from 'src/services/redis/redis.service';
import { app } from '../setup';

describe('UrlClicksCron', () => {
  let cron: UrlClicksCron;
  let db: DatabaseService;
  let redis: RedisService;

  beforeAll(async () => {
    cron = app.get(UrlClicksCron);
    db = app.get(DatabaseService);
    redis = app.get(RedisService);
  });

  describe('flushClicks()', () => {
    it('flushes clicks from redis into db', async () => {
      await db.token.create({
        data: {
          id: 'token',
          hash: 'hash',
        },
      });
      await db.url.createMany({
        data: [
          {
            url: 'abc',
            redirect: 'https://google.com',
            title: 'google',
            tokenId: 'token',
          },
          {
            url: 'cde',
            redirect: 'https://google.com',
            title: 'google',
            tokenId: 'token',
          },
        ],
      });

      await redis.client.set('clicks:abc', 5);
      await redis.client.set('clicks:cde', 7);

      await cron.flushClicks();

      const [dbUrl1, dbUrl2] = await db.url.findMany({
        where: { url: { in: ['abc', 'cde'] } },
        orderBy: {
          url: 'asc',
        },
      });
      expect(dbUrl1!.clicks).toBe(5);
      expect(dbUrl2!.clicks).toBe(7);

      const redisUrl1 = await redis.client.get('clicks:abc');
      const redisUrl2 = await redis.client.get('clicks:cde');
      expect(redisUrl1).toBeNull();
      expect(redisUrl2).toBeNull();
    });
  });
});
