import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class TestService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async test() {
    const value = await this.cache.get<string>('key');
    if (!value) {
      await this.cache.set('key', 'Got from cache!');
    }
    return value ?? 'Put in cache!';
  }
}
