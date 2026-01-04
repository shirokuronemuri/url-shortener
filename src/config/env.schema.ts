import z from 'zod';

export const envSchema = z.object({
  // Always required
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  ADMIN_SECRET: z.string().min(16),
  HOST: z.url().optional(),

  // Optional config values
  URL_LENGTH: z.coerce.number().optional(),
  TOKEN_ID_LENGTH: z.coerce.number().optional(),
  CRON_FLUSH_CLICKS_INTERVAL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
