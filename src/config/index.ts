const port = process.env.PORT || '3000';

export default () => ({
  environment: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  host: process.env.HOST || `http://localhost:${port}`,
  port,
});
