import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request as OriginalRequest, Response, NextFunction } from 'express';
import { APP_VERSION } from '@/utils/constants.js';
import { ulid } from 'ulid';

export interface Request extends OriginalRequest {
    id: string;
    version: string;
}

@Injectable()
export class RequestPreprocessingMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const reqId = req.headers['x-request-id'] ?? ulid();
        req.id = typeof reqId === 'string' ? reqId : reqId[0];
        res.setHeader('X-Request-Id', req.id);
        req.version = APP_VERSION;
        next();
    }
}
