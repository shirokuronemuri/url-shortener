import { Env } from './env.schema';

export const urlConfig = (env: Env) => ({
  urlLength: env.URL_LENGTH ?? 5,
  tokenIdLength: env.TOKEN_ID_LENGTH ?? 8,
  urlGenerationMaxTries: env.URL_GENERATION_MAX_TRIES ?? 5,
  tokenGenerationMaxTries: env.TOKEN_GENERATION_MAX_TRIES ?? 5,
});
