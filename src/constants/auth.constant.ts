import { readFile } from '@/common/utils/index.js';

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
