import _package_info from '@root/package.json' with { type: 'json' };

import { loadEnv } from '@/common/utils/helpers/env.helper.js';
import { readFile } from '@/common/utils/helpers/file.helper.js';

import { registerAs, ConfigType } from '@nestjs/config';
import { z } from 'zod/v4';

loadEnv(process.env.NODE_ENV, {
    quiet: true,
});

const envObject: Record<string, string> = {};

loadEnv(process.env.NODE_ENV, {
    processEnv: envObject,
    quiet: true,
});

// app

export const PACKAGE_INFO = _package_info;

export const APP_VERSION = process.env.APP_VERSION || PACKAGE_INFO.version || 'unknown';

export const APP_NAME = process.env.APP_NAME || PACKAGE_INFO.name || 'unknown';

export const DEFAULT_PORT = Number(process.env.PORT);

export const IS_DEV = process.env.NODE_ENV === 'development';

export const IS_TEST = process.env.NODE_ENV === 'test';

export const IS_PROD = process.env.NODE_ENV === 'production';

export const GIT_COMMIT = process.env.GIT_COMMIT || 'N/A';

const AppConfigValidateSchema = z
    .object({
        NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
        PORT: z.coerce.number().default(3000),
        APP_NAME: z.string().default(PACKAGE_INFO.name || 'unknown'),
        APP_VERSION: z.string().default(PACKAGE_INFO.version || 'unknown'),
        GIT_COMMIT: z.string().default('N/A'),
    })
    .transform((env) => ({
        nodeEnv: env.NODE_ENV,
        port: env.PORT,
        appName: env.APP_NAME,
        appVersion: env.APP_VERSION,
        gitCommit: env.GIT_COMMIT,
        isDev: env.NODE_ENV === 'development',
        isTest: env.NODE_ENV === 'test',
        isProd: env.NODE_ENV === 'production',
        packageInfo: PACKAGE_INFO,
    }));

export const appConfig = registerAs('app', () => AppConfigValidateSchema.parse(envObject));

export type AppConfig = ConfigType<typeof appConfig>;

//

const DatabaseConfigVlidateSchema = z
    .object({
        DATABASE_URL: z.url(),
        SHADOW_DATABASE_URL: z.url(),
    })
    .transform((env) => ({
        databaseUrl: env.DATABASE_URL,
        shadowDatabaseUrl: env.SHADOW_DATABASE_URL,
    }));

export const databaseConfig = registerAs('database', () =>
    DatabaseConfigVlidateSchema.parse(envObject)
);

export type DatabaseConfig = ConfigType<typeof databaseConfig>;

//

export const JWT_ACCESS_TOKEN = {
    get PRIVATE_KEY() {
        return (
            process.env.JWT_ACCESS_PRIVATE_KEY ||
            readFile('config/keys/jwt-private.pem').replace(/\\n/g, '\n')
        );
    },
    get PUBLIC_KEY() {
        return (
            process.env.JWT_ACCESS_PUBLIC_KEY ||
            readFile('config/keys/jwt-public.pem').replace(/\\n/g, '\n')
        );
    },
    get EXPIRES_IN() {
        return process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
    },
    ALGORITHM: 'ES256' as const,
};

export const JWT_REFRESH_TOKEN = {
    get PRIVATE_KEY() {
        return (
            process.env.JWT_REFRESH_PRIVATE_KEY ||
            readFile('config/keys/jwt-private.pem').replace(/\\n/g, '\n')
        );
    },
    get PUBLIC_KEY() {
        return (
            process.env.JWT_REFRESH_PUBLIC_KEY ||
            readFile('config/keys/jwt-public.pem').replace(/\\n/g, '\n')
        );
    },
    get EXPIRES_IN() {
        return process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
    },
    ALGORITHM: 'ES256' as const,
};

export const REFRESH_TOKEN_COOKIE = {
    NAME: 'refresh_token' as const,
    HTTP_ONLY: true as const,
    get SAME_SITE() {
        return (process.env.JWT_REFRESH_COOKIE_SAME_SITE ?? 'lax') as 'lax' | 'strict' | 'none';
    },
    get SECURE() {
        return process.env.JWT_REFRESH_COOKIE_SECURE === 'true';
    },
    get PATH() {
        return process.env.JWT_REFRESH_COOKIE_PATH ?? '/auth';
    },
    get MAX_AGE_MS() {
        return Number(process.env.JWT_REFRESH_COOKIE_MAX_AGE_MS ?? 7 * 24 * 60 * 60 * 1000);
    },
};

const AuthConfigValidateSchema = z
    .object({
        // access token
        JWT_ACCESS_PRIVATE_KEY: z.string().optional(),
        JWT_ACCESS_PUBLIC_KEY: z.string().optional(),
        JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
        // refresh token
        JWT_REFRESH_PRIVATE_KEY: z.string().optional(),
        JWT_REFRESH_PUBLIC_KEY: z.string().optional(),
        JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
        // cookie
        JWT_REFRESH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
        JWT_REFRESH_COOKIE_SECURE: z
            .string()
            .default('false')
            .transform((v) => v === 'true'),
        JWT_REFRESH_COOKIE_PATH: z.string().default('/auth'),
        JWT_REFRESH_COOKIE_MAX_AGE_MS: z.coerce.number().default(7 * 24 * 60 * 60 * 1000),
    })
    .transform((env) => ({
        accessToken: {
            privateKey:
                env.JWT_ACCESS_PRIVATE_KEY ||
                readFile('config/keys/jwt-private.pem').replace(/\\n/g, '\n'),
            publicKey:
                env.JWT_ACCESS_PUBLIC_KEY ||
                readFile('config/keys/jwt-public.pem').replace(/\\n/g, '\n'),
            expiresIn: env.JWT_ACCESS_EXPIRES_IN,
            algorithm: 'ES256' as const,
        },
        refreshToken: {
            privateKey:
                env.JWT_REFRESH_PRIVATE_KEY ||
                readFile('config/keys/jwt-private.pem').replace(/\\n/g, '\n'),
            publicKey:
                env.JWT_REFRESH_PUBLIC_KEY ||
                readFile('config/keys/jwt-public.pem').replace(/\\n/g, '\n'),
            expiresIn: env.JWT_REFRESH_EXPIRES_IN,
            algorithm: 'ES256' as const,
        },
        refreshTokenCookie: {
            name: 'refresh_token' as const,
            httpOnly: true as const,
            sameSite: env.JWT_REFRESH_COOKIE_SAME_SITE, // 'lax' | 'strict' | 'none'
            secure: env.JWT_REFRESH_COOKIE_SECURE, // boolean
            path: env.JWT_REFRESH_COOKIE_PATH,
            maxAgeMs: env.JWT_REFRESH_COOKIE_MAX_AGE_MS, // number
        },
    }));

export const authConfig = registerAs('auth', () => AuthConfigValidateSchema.parse(envObject));

export type AuthConfig = ConfigType<typeof authConfig>;

//

export const SLOW_REQUEST_THRESHOLD = {
    warn: Number(process.env.SLOW_REQUEST_WARN_MS ?? 1000),
    error: Number(process.env.SLOW_REQUEST_ERROR_MS ?? 3000),
} as const;

export const SLOW_QUERY_THRESHOLD = {
    warn: Number(process.env.SLOW_QUERY_WARN_MS ?? 100),
    error: Number(process.env.SLOW_QUERY_ERROR_MS ?? 500),
} as const;

export const API_DOCS_BASE_URL = process.env.API_DOCS_BASE_URL || 'https://api.example.com';

const ObservabilityConfigValidateSchema = z
    .object({
        SLOW_REQUEST_WARN_MS: z.coerce.number().default(1000),
        SLOW_REQUEST_ERROR_MS: z.coerce.number().default(3000),
        SLOW_QUERY_WARN_MS: z.coerce.number().default(100),
        SLOW_QUERY_ERROR_MS: z.coerce.number().default(500),
        API_DOCS_BASE_URL: z.string().default('https://api.example.com'),
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
    ObservabilityConfigValidateSchema.parse(envObject)
);

export type ObservabilityConfig = ConfigType<typeof observabilityConfig>;

export type AllConfig = {
    app: AppConfig;
    database: DatabaseConfig;
    auth: AuthConfig;
    observability: ObservabilityConfig;
};

export const allConfig = {
    appConfig,
    databaseConfig,
    authConfig,
    observabilityConfig,
};

export default [...Object.values(allConfig)];
