import { envSchema } from './env.schema';
import { appConfig } from './app.config';
import { urlConfig } from './url.config';
import { cronConfig } from './cron.config';

export default () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Failed parsing environment variables:');
    console.error(JSON.stringify(parsed.error.issues, null, 2));
    throw new Error('Invalid environment configuration');
  }
  const env = parsed.data;

  return {
    app: appConfig(env),
    url: urlConfig(env),
    cron: cronConfig(env),
    db: {
      url: env.DATABASE_URL,
    },
    redis: {
      url: env.REDIS_URL,
    },
  };
};
