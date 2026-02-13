import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextService } from '../request-context.service.js';
import { APP_VERSION } from '@/utils/constants.js';

/**
 * @description 全局请求拦截器
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
        const ctx = context.switchToHttp();
        const request: any = ctx.getRequest<Request>();
        request.id = crypto.randomUUID();
        request.version = APP_VERSION;
        const requestContext = {
            requestId: request.id,
            timestamp: Date.now(),
            version: request.version,
        };
        return new Observable((subscriber) => {
            RequestContextService.run(requestContext, () => {
                next.handle().subscribe(subscriber);
            });
        });
    }
}
