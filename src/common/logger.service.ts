import { Injectable } from '@nestjs/common';
import pino from 'pino';

function createLogger() {
    const destination = pino.destination({
        dest: './logs/app.log',
        sync: false, // 异步写入
        mkdir: true,
    });
    if (process.env.NODE_ENV === 'development') {
        return pino({
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    // ignore: 'pid,hostname',
                },
            },
            level: 'trace',
            serializers: {
                err: pino.stdSerializers.err, // 正确序列化错误堆栈
                req: pino.stdSerializers.req, // 序列化 HTTP 请求
                res: pino.stdSerializers.res, // 序列化 HTTP 响应
            },
            redact: {
                paths: ['*.body.password', '*.headers.authorization'],
                censor: '[REDACTED]',
            },
        });
    }
    return pino(
        {
            base: {
                env: process.env.NODE_ENV,
                app: 'nestjs-demo-basic',
                version: process.env.npm_package_version,
            },
            level: 'info',
            serializers: {
                err: pino.stdSerializers.err,
                req: pino.stdSerializers.req,
                res: pino.stdSerializers.res,
            },
            redact: {
                paths: ['*.body.password', '*.headers.authorization'],
                censor: '[REDACTED]',
            },
        },
        destination
    );
}

@Injectable()
export class LoggerService {
    private readonly logger = createLogger();

    get(name: string) {
        return this.logger.child({ name });
    }

    fatal(message: string, context?: string) {
        this.logger.fatal({ context }, message);
    }

    error(message: string, context?: string) {
        this.logger.error({ context }, message);
    }

    warn(message: string, context?: string) {
        this.logger.warn({ context }, message);
    }

    info(message: string, context?: string) {
        this.logger.info({ context }, message);
    }

    debug(message: string, context?: string) {
        this.logger.debug({ context }, message);
    }

    trace(message: string, context?: string) {
        this.logger.trace({ context }, message);
    }
}
