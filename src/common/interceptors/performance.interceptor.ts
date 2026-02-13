import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Logger } from '@/common/logger.service.js';
import { Request, Response } from 'express';
import { SLOW_REQUEST_THRESHOLDS } from '@/utils/constants.js';

/**
 * @description 性能监控拦截器
 * - 记录所有 HTTP 请求的响应时间
 * - 当请求耗时超过阈值时记录慢请求日志
 * - 区分成功请求和失败请求的日志级别
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
    private readonly logger = new Logger(PerformanceInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler) {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<Response>();
        const startTime = performance.now();
        response.on('finish', () => {
            const logContext = this.getContext(context);
            const isError = response.statusCode >= 400;
            this.logPerformance(logContext, startTime, isError);
        });
        return next.handle();
    }

    private getContext(context: ExecutionContext) {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const requestId = request.id || 'unknown';
        const method = request.method;
        const url = request.url;
        const status = response.statusCode;
        const remoteAddress = request.ip || request.socket.remoteAddress;
        const remotePort = request.socket.remotePort;
        const version = (request as any).version || 'unknown';

        return {
            requestId,
            http: {
                method,
                url,
                status,
                remoteAddress: remoteAddress || 'unknown',
                remotePort: remotePort || -1,
            },
            version,
        };
    }

    // 记录性能日志
    private logPerformance(logContext: any, startTime: number, isException: boolean) {
        const { method, url } = logContext.http;
        const duration = Math.round(performance.now() - startTime);
        logContext.http.duration = duration;
        logContext.http.durationUnit = 'ms';
        logContext.http.isException = isException;

        // 根据耗时和状态码选择日志级别
        if (duration >= SLOW_REQUEST_THRESHOLDS.error) {
            // 超过 3 秒：error 级别
            // prettier-ignore
            this.logger.error(logContext, `[${method}](${url}) Critical slow request (${duration}ms)`);
        } else if (duration >= SLOW_REQUEST_THRESHOLDS.warn) {
            // 超过 1 秒：warn 级别
            this.logger.warn(logContext, `[${method}](${url}) Slow request (${duration}ms)`);
        } else if (isException) {
            // 快速异常请求：info 级别
            this.logger.info(logContext, `[${method}](${url}) Request failed (${duration}ms)`);
        } else {
            // 正常快速请求：debug 级别
            this.logger.debug(logContext, `[${method}](${url}) Request completed (${duration}ms)`);
        }
    }
}
