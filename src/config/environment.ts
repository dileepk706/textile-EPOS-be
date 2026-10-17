export type EnvType = {
  NODE_ENV?: string;
  LOG_LEVEL: string;
  PORT: number;
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;
  IS_TEST: boolean;
  CORS_ORIGIN: string;
  MONGODB_URI: string;
  DB_NAME: string;
  ACCESS_SECRET: string;
  REFRESH_SECRET: string;
  ACCESS_TTL: string;
  REFRESH_TTL_SEC: number;
  DEFAULT_PASSWORD: string;
};

const isProduction = () => process.env.NODE_ENV === 'production';
const isDevelopment = () => process.env.NODE_ENV === 'development';

const env: EnvType = {
  NODE_ENV: process.env.NODE_ENV,
  LOG_LEVEL: isProduction() ? 'info' : 'debug',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  IS_PRODUCTION: isProduction(),
  IS_DEVELOPMENT: isDevelopment(),
  IS_TEST: false,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/textile_epos',
  DB_NAME: process.env.DB_NAME || 'textile_epos',
  ACCESS_SECRET: process.env.ACCESS_SECRET || 'access_secret',
  REFRESH_SECRET: process.env.REFRESH_SECRET || 'refresh_secret',
  REFRESH_TTL_SEC: 60 * 60, // 1 hour
  ACCESS_TTL: '15m',
  DEFAULT_PASSWORD: process.env.DEFAULT_PASSWORD || '123',
};

export default env;
