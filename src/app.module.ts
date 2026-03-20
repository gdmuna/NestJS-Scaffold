import {
    CorsMiddleware,
    RequestPreprocessingMiddleware,
    RequestScopeMiddleware,
} from './app.middleware.js';
import {
    PerformanceInterceptor,
    ResponseFormatInterceptor,
    TimeoutInterceptor,
} from './app.interceptor.js';
import { AppController, TestController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AllExceptionsFilter } from './app.filter.js';

import { ErrorCatalogModule, AuthModule } from '@/modules/index.js';

import { envValidationSchema } from '@/config/index.js';

import { IS_DEV, IS_PROD, APP_NAME } from '@/constants/index.js';

import { DatabaseService } from '@/infra/database/database.service.js';

import { Logger } from '@/common/logger.service.js';
import { RequestContextService } from '@/common/request-context.service.js';

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: (config) => envValidationSchema.parse(config),
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
        ErrorCatalogModule,
        AuthModule,
    ],
    controllers: [AppController, TestController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: PerformanceInterceptor,
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
            provide: APP_PIPE,
            useClass: ZodValidationPipe,
        },
        AppService,
        DatabaseService,
        Logger,
        RequestContextService,
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestPreprocessingMiddleware, RequestScopeMiddleware, CorsMiddleware)
            .forRoutes('*');
    }
}
