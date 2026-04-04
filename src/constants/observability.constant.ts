import { registerAs, ConfigType } from '@nestjs/config';
import { z } from 'zod';

// observability

export const SLOW_REQUEST_THRESHOLD = {
    get warn() {
        return Number(process.env.SLOW_REQUEST_WARN_MS || 1000);
    },
    get error() {
        return Number(process.env.SLOW_REQUEST_ERROR_MS || 3000);
    },
} as const;

export const SLOW_QUERY_THRESHOLD = {
    get warn() {
        return Number(process.env.SLOW_QUERY_WARN_MS || 100);
    },
    get error() {
        return Number(process.env.SLOW_QUERY_ERROR_MS || 500);
    },
} as const;

export const API_DOCS_BASE_URL = process.env.API_DOCS_BASE_URL || 'https://api.example.com/errors';

const ObservabilityConfigValidateSchema = z
    .object({
        SLOW_REQUEST_WARN_MS: z.coerce.number().default(1000),
        SLOW_REQUEST_ERROR_MS: z.coerce.number().default(3000),
        SLOW_QUERY_WARN_MS: z.coerce.number().default(100),
        SLOW_QUERY_ERROR_MS: z.coerce.number().default(500),
        API_DOCS_BASE_URL: z.url().default('https://api.example.com/errors'),
    })
    .transform((env) => ({
        slowRequestThreshold: {
            warn: env.SLOW_REQUEST_WARN_MS,
            error: env.SLOW_REQUEST_ERROR_MS,
        },
        slowQueryThreshold: {
            warn: env.SLOW_QUERY_WARN_MS,
            error: env.SLOW_QUERY_ERROR_MS,
        },
        apiDocsBaseUrl: env.API_DOCS_BASE_URL,
    }));

export const observabilityConfig = registerAs('observability', () =>
    ObservabilityConfigValidateSchema.parse(process.env)
);

export type ObservabilityConfig = ConfigType<typeof observabilityConfig>;
