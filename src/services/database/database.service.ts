import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from 'src/core/services/logger/logger.service';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {
    const adapter = new PrismaPg({
      connectionString: config.get<string>('dbUrl'),
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
        `Prisma connection error: ${isErrObject ? err.message : err}`,
        isErrObject ? err.stack : undefined,
        DatabaseService.name,
      );
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
        `Failed resetting the DB: ${isErrObject ? err.message : err}`,
        isErrObject ? err.stack : undefined,
        DatabaseService.name,
      );
    }
  }
}
