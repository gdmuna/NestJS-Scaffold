import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './common/prisma.service.js';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000, // 1秒
                limit: process.env.NODE_ENV === 'development' ? Infinity : 3,
            },
            {
                name: 'long',
                ttl: 60000, // 1分钟
                limit: process.env.NODE_ENV === 'development' ? Infinity : 100,
            },
        ]),
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
