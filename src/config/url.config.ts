import { Env } from './env.schema';

export const urlConfig = (env: Env) => ({
  urlLength: env.URL_LENGTH ?? 5,
  tokenIdLength: env.TOKEN_ID_LENGTH ?? 8,
  urlGenerationMaxRetries: env.URL_GENERATION_MAX_RETRIES ?? 5,
  tokenGenerationMaxRetries: env.TOKEN_GENERATION_MAX_RETRIES ?? 5,
});
