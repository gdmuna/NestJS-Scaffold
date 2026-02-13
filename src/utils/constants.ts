export const DEFAULT_PORT = Number(process.env.PORT);

export const IS_DEV = process.env.NODE_ENV === 'development';

export const IS_PROD = process.env.NODE_ENV === 'production';

export const SLOW_REQUEST_THRESHOLDS = {
    warn: Number(process.env.SLOW_REQUEST_WARN_MS) || 1000,
    error: Number(process.env.SLOW_REQUEST_ERROR_MS) || 3000,
} as const;

export const SLOW_QUERY_THRESHOLDS = {
    warn: Number(process.env.SLOW_QUERY_WARN_MS) || 100,
    error: Number(process.env.SLOW_QUERY_ERROR_MS) || 500,
} as const;

export const JWT_ACCESS_TOKEN = {
    SECRET_KEY: process.env.JWT_SECRET,
    EXPIRES_IN: '1h',
} as const;

export const JWT_REFRESH_TOKEN = {
    SECRET_KEY: process.env.JWT_SECRET,
    EXPIRES_IN: '3d',
} as const;
