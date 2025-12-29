import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import helmet from 'helmet';
import { DatabaseService } from '../src/database/database.service';
import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';

let app: INestApplication<App>;
let server: App;
let databaseService: DatabaseService;
let cacheService: Cache;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.use(helmet());
  await app.init();
  server = app.getHttpServer();
  databaseService = app.get(DatabaseService);
  cacheService = app.get(CACHE_MANAGER);
});

afterEach(async () => {
  await cacheService.clear();
  await databaseService.reset();
});

afterAll(async () => {
  await app.close();
});

export { server, databaseService, cacheService };
