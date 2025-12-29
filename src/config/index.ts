export default () => ({
  environment: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
});
