export enum STATUS_CODE {
  OK = 200,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER = 500,
  UNAUTHORIZED = 401,
  DUPLICATED = 409,
  FORBIDDEN = 403,
  GONE = 410,
  EXPIRED = 498,
  NOT_ALLOWED = 405,
  LOCKED = 423,
}
export enum USER_ROLES {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
}
export const ENVIRONMENTS = {
  development: 'development',
  production: 'production',
  staging: 'staging',
  test: 'test',
} as const;

export type EnvironmentType = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS];
export enum ENVIRONMENT {
  LOCAL = 'LOCAL',
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
}

export enum LEVELS {
  INFO = 'INFO',
  WARNINIG = 'WARNINIG',
  DEBUG = 'DEBUG',
  ERROR = 'ERROR',
}

export const BASIC_POPULATE_OBJECT = {
  createdBy: {
    path: 'createdBy',
  },
};

export enum APP_ACCESS {
  NO_ACCESS = 'NO_ACCESS',
  READ = 'READ',
  WRITE = 'WRITE',
}

export enum LANGUAGES {
  en = 'en',
  fr = 'fr',
  ar = 'ar',
}

export enum ORDER_STATUS {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}
