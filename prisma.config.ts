import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'src/services/database/schema.prisma',
  migrations: {
    path: 'src/services/database/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
