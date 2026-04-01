export const SLOW_REQUEST_THRESHOLDS = {
    warn: Number(process.env.SLOW_REQUEST_WARN_MS ?? 1000),
    error: Number(process.env.SLOW_REQUEST_ERROR_MS ?? 3000),
} as const;

export const SLOW_QUERY_THRESHOLDS = {
    warn: Number(process.env.SLOW_QUERY_WARN_MS ?? 100),
    error: Number(process.env.SLOW_QUERY_ERROR_MS ?? 500),
} as const;

export const API_DOCS_BASE_URL = process.env.API_DOCS_BASE_URL || 'https://api.example.com';
