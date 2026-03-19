import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module.js';

import figlet from 'figlet';
import { atlas } from 'gradient-string';

import compression from 'compression';

import { Logger as pinoLogger } from 'nestjs-pino';
import { Logger } from '@/common/logger.service.js';

import helmet from 'helmet';

import { APP_VERSION } from '@/app.constant.js';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    app.useLogger(app.get(pinoLogger));
    const logger = new Logger('Bootstrap');

    app.use(helmet());

    app.use(compression({ threshold: 1024 }));

    const config = new DocumentBuilder()
        .setTitle('Nestjs-Demo-Basic API')
        .setDescription('The API description')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
        .build();
    const documentFactory = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-doc', app, cleanupOpenApiDoc(documentFactory));

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

bootstrap()
    .then(async () => {
        // 等待 pino-pretty Worker 线程完成日志输出
        await new Promise((resolve) => setTimeout(resolve, 200));
        const startupBanner = await figlet.text('NestJS-Demo-Basic', {
            font: 'Slant',
            horizontalLayout: 'fitted',
        });
        process.stdout.write(atlas.multiline(startupBanner + `\nv${APP_VERSION} | by FOV-RGT\n\n`));
    })
    .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Bootstrap failed:', err);
        process.exit(1);
    });
