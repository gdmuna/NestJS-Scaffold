import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

import figlet from 'figlet';
import { atlas } from 'gradient-string';

import compression from 'compression';
import express from 'express';

import { Logger as pinoLogger } from 'nestjs-pino';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const logger = new Logger('Bootstrap');

    app.enableCors({
        origin: (origin: string, callback: any) => {
            const allowedOrigins =
                process.env.ALLOWED_ORIGINS_PROD?.split(',').map((o) => o.trim()) || [];

            if (
                process.env.NODE_ENV === 'development' &&
                typeof process.env.ALLOWED_ORIGINS_DEV === 'string'
            ) {
                allowedOrigins.push(
                    ...process.env.ALLOWED_ORIGINS_DEV.split(',').map((o) => o.trim())
                );
            }

            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
        maxAge: 86400,
    });

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    app.use(compression({ threshold: 1024 }));

    const port = parseInt(process.env.PORT ?? '3000', 10);
    await app.listen(port).catch((err) => {
        if (err.code === 'EADDRINUSE') {
            logger.error(
                `❌ 启动失败：端口 ${port} 已被占用。`,
                `
\x1b[33m请尝试以下方案：
1. 使用其他端口：更改环境变量 PORT 的值
2. 查找占用端口的进程：
    - （Windows）：netstat -ano | findstr :${port}
    - （Linux/Mac）：lsof -i :${port}
3. 杀死占用端口的进程：
    - （Windows）：taskkill /PID <PID> /F （例：taskkill /PID 36396 /F）
    - （Linux/Mac）：kill -9 <PID> （例：kill -9 36396）\x1b[0m
`
            );
        } else {
            logger.error('❌ 启动失败：未知错误:', err);
        }
        process.exit(1);
    });

    logger.log(`✅ 服务已启动于: http://localhost:${port}\n`);

    const startupBanner = await figlet.text('NestJS-Demo-Basic', {
        font: 'Slant',
        horizontalLayout: 'fitted',
    });
    process.stdout.write(
        atlas.multiline(
            startupBanner + `\nv${process.env.npm_package_version ?? '0.0.0'} | by FOV-RGT\n\n`
        )
    );
    app.useLogger(app.get(pinoLogger));
}

bootstrap();
