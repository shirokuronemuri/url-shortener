import { Env } from './env.schema';

export const cronConfig = (env: Env) => ({
  flushClicksInterval: env.CRON_FLUSH_CLICKS_INTERVAL ?? '*/15 * * * *',
});
