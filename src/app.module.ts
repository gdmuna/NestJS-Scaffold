import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController, TestController } from '@/app.controller.js';
import { AppService } from '@/app.service.js';
import { DatabaseService } from '@/common/database.service.js';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter.js';
import {
    PerformanceInterceptor,
    RequestContextInterceptor,
    ResponseFormatInterceptor,
    TimeoutInterceptor,
} from '@/common/interceptors/index.js';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';
import { IS_DEV, IS_PROD, APP_NAME } from '@/utils/constants.js';
import { Logger } from '@/common/logger.service.js';
import { RequestPreprocessingMiddleware } from '@/common/middleware/request-preprocessing.middleware.js';
import { z } from 'zod/v4';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: (config) => {
                const envSchema = z.object({
                    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
                    PORT: z
                        .string()
                        .transform((val, ctx) => {
                            if (!val) return val;
                            const parsed = parseInt(val);
                            if (isNaN(parsed) || parsed <= 0 || parsed > 65535) {
                                ctx.addIssue({
                                    code: 'invalid_type',
                                    expected: 'valid port number',
                                    received: val,
                                });
                                return z.NEVER;
                            }
                            return String(parsed);
                        })
                        .default('3000'),
                    DB_URL: z.url(),
                    ALLOWED_ORIGINS_PROD: z
                        .string()
                        .transform((val, ctx) => {
                            val.split(',')
                                .filter((o) => o)
                                .forEach((origin) => {
                                    const ok = z.url().safeParse(origin);
                                    if (!ok.success) {
                                        ctx.addIssue({
                                            code: 'invalid_type',
                                            expected: 'comma-separated list of valid URLs',
                                            received: val,
                                        });
                                        return z.NEVER;
                                    }
                                });
                            return val;
                        })
                        .optional(),
                    ALLOWED_ORIGINS_DEV: z
                        .string()
                        .transform((val, ctx) => {
                            val.split(',')
                                .filter((o) => o)
                                .forEach((origin) => {
                                    const ok = z.url().safeParse(origin);
                                    if (!ok.success) {
                                        ctx.addIssue({
                                            code: 'invalid_type',
                                            expected: 'comma-separated list of valid URLs',
                                            received: val,
                                        });
                                        return z.NEVER;
                                    }
                                });
                            return val;
                        })
                        .optional(),
                    LOG_LEVEL: z
                        .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent', ''])
                        .optional(),
                    SLOW_REQUEST_WARN_MS: z
                        .string()
                        .transform((val, ctx) => {
                            if (!val) return val;
                            const parsed = parseInt(val);
                            if (isNaN(parsed) || parsed < 0) {
                                ctx.addIssue({
                                    code: 'invalid_type',
                                    expected: 'non-negative integer',
                                    received: val,
                                });
                                return z.NEVER;
                            }
                            return String(parsed);
                        })
                        .optional(),
                    SLOW_REQUEST_ERROR_MS: z
                        .string()
                        .transform((val, ctx) => {
                            if (!val) return val;
                            const parsed = parseInt(val);
                            if (isNaN(parsed) || parsed < 0) {
                                ctx.addIssue({
                                    code: 'invalid_type',
                                    expected: 'non-negative integer',
                                    received: val,
                                });
                                return z.NEVER;
                            }
                            return String(parsed);
                        })
                        .optional(),
                    SLOW_QUERY_WARN_MS: z
                        .string()
                        .transform((val, ctx) => {
                            if (!val) return val;
                            const parsed = parseInt(val);
                            if (isNaN(parsed) || parsed < 0) {
                                ctx.addIssue({
                                    code: 'invalid_type',
                                    expected: 'non-negative integer',
                                    received: val,
                                });
                                return z.NEVER;
                            }
                            return String(parsed);
                        })
                        .optional(),
                    SLOW_QUERY_ERROR_MS: z
                        .string()
                        .transform((val, ctx) => {
                            if (!val) return val;
                            const parsed = parseInt(val);
                            if (isNaN(parsed) || parsed < 0) {
                                ctx.addIssue({
                                    code: 'invalid_type',
                                    expected: 'non-negative integer',
                                    received: val,
                                });
                                return z.NEVER;
                            }
                            return String(parsed);
                        })
                        .optional(),
                    REQUEST_TIMEOUT_MS: z
                        .string()
                        .transform((val, ctx) => {
                            if (!val) return val;
                            const parsed = parseInt(val);
                            if (isNaN(parsed) || parsed < 0) {
                                ctx.addIssue({
                                    code: 'invalid_type',
                                    expected: 'non-negative integer',
                                    received: val,
                                });
                                return z.NEVER;
                            }
                            return String(parsed);
                        })
                        .optional(),
                });
                return envSchema.parse(config);
            },
        }),
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000, // 1秒
                limit: IS_DEV ? Infinity : 3,
            },
            {
                name: 'long',
                ttl: 60000, // 1分钟
                limit: IS_DEV ? Infinity : 100,
            },
        ]),
        LoggerModule.forRoot({
            pinoHttp: [
                {
                    name: APP_NAME,
                    level: process.env.LOG_LEVEL || (!IS_PROD ? 'trace' : 'info'),
                    // prettier-ignore
                    transport:
                    IS_DEV ? {
                        target: 'pino-pretty',
                        options: {
                            sync: true,
                            colorize: true,
                            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
                            // messageFormat: '{if req.method}[{req.method}]({req.url}){end} {if context}{context} - {end}{msg}',
                        },
                    } : undefined,
                    serializers: {
                        err: () => undefined, // 错误堆栈交由 exceptions.filter 处理，避免重复记录
                        req: () => undefined, // 请求信息交由 performance.interceptor 处理，避免重复记录
                    },
                    // prettier-ignore
                    // 全局隐藏敏感信息
                    redact:
                    !IS_DEV ? {
                        paths: ['*.headers.authorization'],
                        censor: '[REDACTED]',
                    } : undefined,
                    autoLogging: false,
                },
                pino.destination({
                    dest: './logs/app.log',
                    sync: false, // 异步写入
                    mkdir: true,
                }),
            ],
        }),
    ],
    controllers: [AppController, TestController],
    providers: [
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
        {
            provide: APP_PIPE,
            useClass: ZodValidationPipe,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: PerformanceInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: RequestContextInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseFormatInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TimeoutInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ZodSerializerInterceptor,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        AppService,
        DatabaseService,
        Logger,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestPreprocessingMiddleware).forRoutes('*');
    }
}
