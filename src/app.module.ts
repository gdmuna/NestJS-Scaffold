import { Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './common/prisma.service.js';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000, // 1秒
                limit: process.env.NODE_ENV !== 'development' ? Infinity : 3,
            },
            {
                name: 'long',
                ttl: 60000, // 1分钟
                limit: process.env.NODE_ENV === 'development' ? Infinity : 100,
            },
        ]),
        LoggerModule.forRoot({
            pinoHttp: {
                level: process.env.NODE_ENV !== 'production' ? 'trace' : 'info',
                // prettier-ignore
                transport:
                    process.env.NODE_ENV !== 'production' ? {
                        target: 'pino-pretty',
                        options: {
                            colorize: true,
                            translateTime: 'SYS:standard',
                            messageFormat: '{if req.method}[{req.method}]({req.url}){end} {if context}{context} - {end}{msg}',
                        },
                    } : undefined,
                serializers: {
                    err: () => undefined, // 错误堆栈交由 exceptions.filter 处理，避免重复记录
                    // 请求序列化
                    req: (req) => {
                        const isDev = process.env.NODE_ENV !== 'production';
                        return {
                            id: req.id,
                            method: req.method,
                            url: req.url,
                            // 开发环境记录 query 和 params
                            ...(isDev && {
                                query: req.query,
                                params: req.params,
                            }),
                            // 只记录部分关键 headers
                            headers: {
                                'user-agent': req.headers['user-agent'],
                                'content-type': req.headers['content-type'],
                                ...(req.headers.authorization && { authorization: '[REDACTED]' }),
                            },
                            remoteAddress: req.remoteAddress,
                            remotePort: req.remotePort,
                        };
                    },
                    // 响应序列化
                    res: (res) => {
                        return {
                            statusCode: res.statusCode,
                            // 只记录关键响应头
                            headers: {
                                'content-type': res.headers['content-type'],
                                'content-length': res.headers['content-length'],
                            },
                        };
                    },
                },
                // 全局隐藏敏感信息
                redact: {
                    paths: ['*.headers.authorization'],
                    censor: '[REDACTED]',
                },
                // 忽略健康检查等端点
                autoLogging: {
                    ignore: (req) => req.url === '/health',
                },
            },
            exclude: [
                { path: 'hello', method: RequestMethod.ALL },
                // { path: 'login', method: RequestMethod.POST }
            ],
        }),
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_PIPE,
            useClass: ZodValidationPipe,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ZodSerializerInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        AppService,
        PrismaService,
    ],
})
export class AppModule {}
