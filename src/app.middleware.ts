import { APP_VERSION, IS_DEV } from '@/constants/index.js';

import { Logger, RequestContextService } from '@/common/services/index.js';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ulid } from 'ulid';

@Injectable()
export class RequestPreprocessingMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const reqId = req.headers['flx-request-id'] ?? ulid();
        req.id = typeof reqId === 'string' ? reqId : reqId[0];
        res.setHeader('flx-request-id', req.id);
        req.version = APP_VERSION;
        next();
    }
}

@Injectable()
export class RequestScopeMiddleware implements NestMiddleware {
    constructor(private readonly requestContextService: RequestContextService) {}
    use(req: Request, _: Response, next: NextFunction) {
        const requestContext = {
            requestId: typeof req.id === 'string' ? req.id : String(req.id ?? 'unknown'),
            time: Date.now(),
            version: req.version,
        };
        this.requestContextService.run(requestContext, () => {
            next();
        });
    }
}

@Injectable()
export class CorsMiddleware implements NestMiddleware {
    private readonly logger = new Logger(CorsMiddleware.name);

    use(req: Request, res: Response, next: NextFunction) {
        const origin = (req.headers.origin as string) || (req.headers.referer as string);

        // 预检请求单独处理
        if (req.method === 'OPTIONS') {
            if (this.isOriginAllowed(origin)) {
                this.setCorsHeaders(res, origin);
                res.sendStatus(204);
            } else {
                this.logger.debug(
                    {
                        requestId: req.id,
                        origin,
                        method: req.method,
                        url: req.url,
                    },
                    'CORS preflight rejected'
                );
                res.status(403).json({
                    success: false,
                    code: 'CORS_FORBIDDEN',
                    message: origin
                        ? `Origin "${origin}" is not allowed by CORS policy`
                        : 'CORS policy rejected this request',
                    requestId: req.id ?? 'unknown',
                });
            }
            return;
        }

        // 实际请求：检查CORS
        if (this.isOriginAllowed(origin)) {
            this.setCorsHeaders(res, origin);
            next();
        } else {
            this.logger.debug(
                {
                    requestId: req.id,
                    origin,
                    method: req.method,
                    url: req.url,
                },
                'CORS rejected'
            );
            res.status(403).json({
                success: false,
                code: 'CORS_FORBIDDEN',
                message: origin
                    ? `Origin "${origin}" is not allowed by CORS policy`
                    : 'CORS policy rejected this request',
                requestId: req.id,
            });
        }
    }

    /**
     * 验证CORS源是否被允许
     */
    private isOriginAllowed(origin: string | undefined): boolean {
        // 允许没有origin的请求（如移动应用、桌面应用、CURL等）
        if (!origin) {
            return true;
        }

        if (IS_DEV) {
            return true;
        }

        const allowedOrigins = this.getAllowedOrigins();
        return allowedOrigins.length === 0 || allowedOrigins.includes(origin);
    }

    /**
     * 设置CORS响应头
     */
    private setCorsHeaders(res: Response, origin: string | undefined): void {
        if (origin) {
            res.header('Access-Control-Allow-Origin', origin);
        }
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,flx-request-id');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400');
    }

    /**
     * 获取允许的源列表
     */
    private getAllowedOrigins(): string[] {
        const origins: string[] = [];

        // 生产环境白名单
        if (process.env.ALLOWED_ORIGINS_PROD) {
            origins.push(
                ...process.env.ALLOWED_ORIGINS_PROD.split(',')
                    .map((o) => o.trim())
                    .filter((o) => o)
            );
        }

        // 开发环境额外白名单
        if (process.env.NODE_ENV === 'development' && process.env.ALLOWED_ORIGINS_DEV) {
            origins.push(
                ...process.env.ALLOWED_ORIGINS_DEV.split(',')
                    .map((o) => o.trim())
                    .filter((o) => o)
            );
        }

        return origins;
    }
}
