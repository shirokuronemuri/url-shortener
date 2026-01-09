import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import helmet from 'helmet';
import { DatabaseService } from '../src/services/database/database.service';
import { RedisService } from '../src/services/redis/redis.service';

jest.unmock('nanoid');

let app: INestApplication<App>;
let server: App;
let databaseService: DatabaseService;
let redis: RedisService;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.use(helmet());
  await app.init();
  server = app.getHttpServer();
  databaseService = app.get(DatabaseService);
  redis = app.get(RedisService);
  await redis.client.flushdb();
  await databaseService.reset();
});

afterEach(async () => {
  await redis.client.flushdb();
  await databaseService.reset();
});

afterAll(async () => {
  await app.close();
});

export { server, app };
