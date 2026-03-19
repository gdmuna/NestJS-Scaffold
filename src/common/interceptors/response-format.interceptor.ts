import { Injectable, NestInterceptor, CallHandler, ExecutionContext } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { RequestContextService } from '@/common/request-context.service.js';

@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
    constructor(private readonly requestContextService: RequestContextService) {}

    intercept(_: ExecutionContext, next: CallHandler) {
        return next.handle().pipe(
            map((data) => {
                const requestContext = this.requestContextService.get() ?? null;
                return {
                    success: true,
                    data: data ?? null,
                    timestamp: new Date().toISOString(),
                    context: requestContext,
                };
            })
        );
    }
}
