import { ENVIRONMENT, EnvironmentType } from '../types/consts';

export const ENV = {
  NODE_ENV: (process.env['NODE_ENV'] as EnvironmentType) || 'development',
  MONGO_URI: getConnectionString(),
  SERVER_PORT: parseInt(process.env['SERVER_PORT'] as string) || 3001,
  API_BASE_URL: process.env['API_BASE_URL']!,
  ENVIRONMENT: process.env.ENVIRONMENT || ENVIRONMENT.DEVELOPMENT,
  CRM_PATH: process.env.CRM_PATH || 'http://localhost:5173',
  SALTKEY: parseInt(process.env.SALTKEY as string) || 4,
  SECRETKEY: process.env.SECRETKEY || 'secretKeyDelaplakProject',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  UPLOAD_BASE_URL: process.env.UPLOAD_BASE_URL || 'http://localhost:3001/uploads',
  REFRESH_TOKEN_COOKIE_NAME: process.env.REFRESH_TOKEN_COOKIE_NAME || 'refreshToken',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT as string) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'DeLAPLAK <no-reply@delaplak.dev>',
} as const;
export const isInDevelopmentMode = ENV.NODE_ENV === 'development';
export const isInProductionMode = ENV.NODE_ENV === 'production';
export const isInStagingMode = ENV.NODE_ENV === 'staging';
export const isInTestMode = ENV.NODE_ENV === 'test';

function getConnectionString() {
  if (process.env['ATLAS_URL']) {
    return process.env['ATLAS_URL'];
  }

  const MONGO_DB_USER = process.env['MONGO_DB_USER'] || undefined;
  const MONGO_DB_PASSWORD = process.env['MONGO_DB_PASSWORD'] || undefined;
  const DB_HOST = process.env['MONGO_HOST'];
  const MONGO_DB_NAME = process.env['MONGO_DB_NAME'];

  if (!DB_HOST) {
    return `mongodb://localhost:27017/${MONGO_DB_NAME || 'delaplak-dev'}`;
  }

  if (!MONGO_DB_NAME) {
    return `mongodb://localhost:27017/delaplak-dev`;
  }

  let connectionString = `mongodb://`;
  if (MONGO_DB_USER && MONGO_DB_PASSWORD) {
    connectionString += `${encodeURIComponent(MONGO_DB_USER as string)}:${encodeURIComponent(MONGO_DB_PASSWORD as string)}@`;
  }
  connectionString += `${DB_HOST}/${MONGO_DB_NAME}`;

  return connectionString;
}
