import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

import figlet from 'figlet';
import { atlas } from 'gradient-string';

import compression from 'compression';
import express from 'express';

import { Logger as pinoLogger } from 'nestjs-pino';
import { Logger } from '@/common/logger.service.js';

import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    app.useLogger(app.get(pinoLogger));
    const logger = new Logger('Bootstrap');

    app.use(helmet());

    app.enableCors({
        origin: (origin: string, callback: any) => {
            const allowedOrigins =
                process.env.ALLOWED_ORIGINS_PROD?.split(',')
                    .map((o) => o.trim())
                    .filter((o) => o) || [];

            if (
                process.env.NODE_ENV === 'development' &&
                typeof process.env.ALLOWED_ORIGINS_DEV === 'string'
            ) {
                allowedOrigins.push(
                    ...process.env.ALLOWED_ORIGINS_DEV.split(',')
                        .map((o) => o.trim())
                        .filter((o) => o)
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

    const port = parseInt(process.env.PORT ?? '3000');
    await app.listen(port).catch(async (err) => {
        if (err.code === 'EADDRINUSE') {
            logger.fatal(
                `❌ 启动失败：端口 ${port} 已被占用。
\x1b[33m请尝试以下方案：
1. 使用其他端口：更改环境变量 PORT 的值
2. 查找占用端口的进程：
    - （Windows）：netstat -ano | findstr :${port}
    - （Linux/Mac）：lsof -i :${port}
3. 杀死占用端口的进程：
    - （Windows）：taskkill /PID <PID> /F （例：taskkill /PID 36396 /F）
    - （Linux/Mac）：kill -9 <PID> （例：kill -9 36396）\x1b[0m`
            );
        }
        app.flushLogs(); // 打印缓冲日志并分离缓冲区
        await app.close();
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 确保日志写出
        process.exit(1);
    });
    logger.log(`✅ 服务已启动于: http://localhost:${port}`);
}

bootstrap().then(async () => {
    // 等待 pino-pretty Worker 线程完成日志输出
    await new Promise((resolve) => setTimeout(resolve, 200));
    const startupBanner = await figlet.text('NestJS-Demo-Basic', {
        font: 'Slant',
        horizontalLayout: 'fitted',
    });
    process.stdout.write(
        atlas.multiline(
            startupBanner + `\nv${process.env.npm_package_version || '0.0.0'} | by FOV-RGT\n\n`
        )
    );
});
