import { Env } from './env.schema';

export const appConfig = (env: Env) => ({
  environment: env.NODE_ENV,
  port: env.PORT,
  host: env.HOST || `http://localhost${env.PORT}`,
  adminSecret: env.ADMIN_SECRET,
});
