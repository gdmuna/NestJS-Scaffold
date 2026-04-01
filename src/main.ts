import { AppModule } from './app.module.js';

import { APP_VERSION, loadEnv } from '@/constants/index.js';

import { Logger } from '@/common/services/index.js';

import { NestFactory } from '@nestjs/core';
import figlet from 'figlet';
import { atlas } from 'gradient-string';
import compression from 'compression';
import { Logger as pinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import cookieParser from 'cookie-parser';
import { relative } from 'path';

async function bootstrap() {
    loadEnv(process.env.NODE_ENV);
    const envFilePath = relative(process.cwd(), `.env.${process.env.NODE_ENV}`);
    // eslint-disable-next-line no-console
    console.log('加载环境变量文件：', `\x1b[36m${envFilePath}\x1b[0m`);

    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    app.useLogger(app.get(pinoLogger));
    const logger = new Logger('Bootstrap');

    app.use(helmet());

    app.use(compression({ threshold: 1024 }));

    app.use(cookieParser());

    const docConfig = new DocumentBuilder()
        .setTitle('Nestjs-Demo-Basic API')
        .setDescription('The API description')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
        .build();
    const documentFactory = SwaggerModule.createDocument(app, docConfig);
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
        } else if (err.code === 'EACCES') {
            logger.fatal(
                `❌ 启动失败：没有权限绑定到端口 ${port}。
\x1b[33m请尝试以下方案：
1. 以管理员身份运行应用程序
    - （Windows）：以管理员权限运行 PowerShell，然后执行 pnpm start:dev
2. 使用更高端口号（1024 以上）：修改 .env 文件设置 PORT=8000
3. 检查防火墙或安全软件是否阻止\x1b[0m`
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
        let signature: string = '';
        if (APP_VERSION !== 'unknown' && APP_VERSION) {
            signature += `v${APP_VERSION} | `;
        }
        signature += 'by FOV-RGT';
        process.stdout.write(atlas.multiline(startupBanner + `\n${signature}\n\n`));
    })
    .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Bootstrap failed:', err);
        process.exit(1);
    });
