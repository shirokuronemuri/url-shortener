import z from 'zod';

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

export const envSchema = z.object({
  // Always required
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.preprocess(emptyToUndefined, z.coerce.number().default(3000)),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  ADMIN_SECRET: z.string().min(16),
  HOST: z.preprocess(emptyToUndefined, z.url().optional()),

  // Optional config values
  URL_LENGTH: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(3).max(128).optional(),
  ),

  TOKEN_ID_LENGTH: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(3).max(128).optional(),
  ),

  CRON_FLUSH_CLICKS_INTERVAL: z.preprocess(
    emptyToUndefined,
    z.string().optional(),
  ),

  URL_GENERATION_MAX_TRIES: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(1).optional(),
  ),

  TOKEN_GENERATION_MAX_TRIES: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(1).optional(),
  ),
});

export type Env = z.infer<typeof envSchema>;
