import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController, TestController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseService } from './common/database.service.js';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import {
    PerformanceInterceptor,
    RequestContextInterceptor,
    ResponseFormatInterceptor,
} from './common/interceptors/index.js';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';
import { IS_DEV, IS_PROD } from './utils/constants.js';
import { Logger } from '@/common/logger.service.js';
import { RequestPreprocessingMiddleware } from './common/middleware/request-preprocessing.middleware.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
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
                    name: process.env.npm_package_name,
                    level: process.env.LOG_LEVEL || (!IS_PROD ? 'trace' : 'info'),
                    // prettier-ignore
                    transport:
                    IS_DEV ? {
                        target: 'pino-pretty',
                        options: {
                            sync: true,
                            colorize: true,
                            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
                            messageFormat: '{if req.method}[{req.method}]({req.url}){end} {if context}{context} - {end}{msg}',
                        },
                    } : undefined,
                    serializers: {
                        err: () => undefined, // 错误堆栈交由 exceptions.filter 处理，避免重复记录
                        // 请求序列化
                        // req: (req) => {
                        //     return {
                        //         id: req.id,
                        //         method: req.method,
                        //         url: req.url,
                        //         query: req.query,
                        //         params: req.params,
                        //         // 只记录部分关键 headers
                        //         headers: {
                        //             'user-agent': req.headers['user-agent'],
                        //             'content-type': req.headers['content-type'],
                        //             authorization: req.headers['authorization'],
                        //         },
                        //         remoteAddress: req.remoteAddress,
                        //         remotePort: req.remotePort,
                        //     };
                        // },
                        req: () => undefined, // 请求信息交由 performance.interceptor 处理，避免重复记录
                        // 响应序列化
                        // res: (res) => {
                        //     return {
                        //         statusCode: res.statusCode,
                        //         // 只记录关键响应头
                        //         headers: {
                        //             'content-type': res.headers['content-type'],
                        //             'content-length': res.headers['content-length'],
                        //         },
                        //     };
                        // },
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
            // 排除的日志记录路径和方法
            // exclude: [
            //     { path: '/hello', method: RequestMethod.ALL },
            //     { path: '/health', method: RequestMethod.ALL },
            //     { path: '/logger/*', method: RequestMethod.ALL },
            //     { path: '/perf-test/*', method: RequestMethod.ALL },
            // ],
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
