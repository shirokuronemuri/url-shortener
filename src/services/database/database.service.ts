import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { LoggerService } from 'src/core/services/logger/logger.service';
import { TypedConfigService } from 'src/config/typed-config.service';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly config: TypedConfigService,
    private readonly logger: LoggerService,
  ) {
    const adapter = new PrismaPg({
      connectionString: config.get('db.url'),
    });
    super({ adapter, log: ['info', 'warn', 'error'] });
  }
  async onModuleInit() {
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Prisma connected to PostgreSQL', DatabaseService.name);
    } catch (err) {
      const isErrObject = err instanceof Error;
      this.logger.error(
        `Prisma connection error: ${isErrObject ? err.message : String(err)}`,
        isErrObject ? err.stack : undefined,
        DatabaseService.name,
      );
      if (this.config.get('app.environment') === 'test') {
        process.exit(1);
      }
    }
  }
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from PostgreSQL');
  }

  async reset() {
    const tablenames = await this.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    try {
      await this.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (err) {
      const isErrObject = err instanceof Error;
      this.logger.error(
        `Failed resetting the DB: ${isErrObject ? err.message : String(err)}`,
        isErrObject ? err.stack : undefined,
        DatabaseService.name,
      );
    }
  }
}
