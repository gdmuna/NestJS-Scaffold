import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    RequestTimeoutException,
} from '@nestjs/common';
import { throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/**
 * @description 请求超时拦截器
 * - 限制请求处理时间不超过配置的阈值
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
    private readonly timeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000'); // 默认 30 秒

    intercept(_: ExecutionContext, next: CallHandler) {
        return next.handle().pipe(
            timeout(this.timeoutMs),
            catchError((err) => {
                if (err instanceof TimeoutError) {
                    return throwError(
                        () =>
                            new RequestTimeoutException({
                                message: `Request timed out after ${this.timeoutMs}ms`,
                                code: 'REQUEST_TIMEOUT',
                            })
                    );
                }
                return throwError(() => err);
            })
        );
    }
}
