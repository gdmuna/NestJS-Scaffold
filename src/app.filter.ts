import { ErrorCatalogService } from '@/modules/error-catalog/error-catalog.service.js';

import { BusinessException } from '@/common/exceptions/index.js';
import { Logger, RequestContextService } from '@/common/services/index.js';

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@root/prisma/generated/internal/prismaNamespace.js';
import { ZodValidationException, ZodSerializationException } from 'nestjs-zod';
import { ZodError } from 'zod/v4';
import { ThrottlerException } from '@nestjs/throttler';

/**
 * @description: 全局异常过滤器，捕获所有未处理的异常并返回统一格式的错误响应
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    constructor(
        private readonly errorCatalogService: ErrorCatalogService,
        private readonly requestContextService: RequestContextService
    ) {}

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const { message, code, status, details, level } = this.parseException(exception);

        const stack = (exception as any).stack ?? 'No stack trace available';

        const requestContext = this.requestContextService.get() ?? null;

        const logContext = {
            requestId: request.id || 'unknown',
            version: request.version || 'unknown',
            ...(request.jwtClaim?.user && {
                user: {
                    id: request.jwtClaim?.user.id,
                    username: request.jwtClaim?.user.username,
                },
            }),
            metadata: requestContext?.metadata ?? null,
            details: details ?? null,
            error: {
                type: exception?.constructor?.name ?? 'Unknown',
                code,
                message,
                status,
            },
        };

        if (level === 'error' || (!level && status >= 500)) {
            this.logger.error(logContext, `Internal error\n${stack}`);
        } else if (level === 'warn' || (!level && status === 429)) {
            // 限流 - warn 级别
            this.logger.warn(logContext, `Rate limit exceeded: ${message}`);
        } else if (level === 'warn' || (!level && status === 408)) {
            // 请求超时 - warn 级别
            this.logger.warn(logContext, message);
        } else if (level === 'info' || (!level && status >= 400)) {
            // 其他客户端错误 - info 级别
            this.logger.info(logContext, `Client error: ${message}`);
        } else {
            // 其他情况 - fatal 级别
            this.logger.fatal(logContext, `Unexpected exception\n${stack}`);
        }

        const exceptionRes = {
            success: false,
            code,
            message,
            type: this.errorCatalogService.getErrorTypeUrl(code),
            timestamp: new Date().toISOString(),
            context: requestContext,
            details: details ?? null,
        };
        response.status(status).json(exceptionRes);
    }

    // 解析异常，区分不同类型的异常并提取相关信息
    private parseException(exception: unknown) {
        // 处理业务异常
        if (exception instanceof BusinessException) {
            const response: any = exception.getResponse();
            return {
                message: exception.message ?? 'Business Exception',
                code:
                    typeof response === 'string'
                        ? response
                        : (response.code ?? 'BUSINESS_EXCEPTION'),
                status: exception.getStatus() ?? HttpStatus.BAD_REQUEST,
                details: typeof response === 'object' ? response.details : undefined,
            };
        }

        // 处理请求参数验证异常
        if (exception instanceof ZodValidationException) {
            const zodError = exception.getZodError() as ZodError;
            const details = zodError.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
                code: issue.code,
            }));
            this.requestContextService.mergeContextMetadata({ validationErrors: details });
            return {
                message: 'Bad Request',
                code: 'VALIDATION_FAILED',
                status: HttpStatus.BAD_REQUEST,
                details,
            };
        }

        // 处理响应序列化异常
        if (exception instanceof ZodSerializationException) {
            return {
                message: 'Internal Server Error',
                code: 'SERIALIZATION_ERROR',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
            };
        }

        if (exception instanceof ThrottlerException) {
            return {
                message: exception.message ?? 'Too Many Requests',
                code: 'TOO_MANY_REQUESTS',
                status: HttpStatus.TOO_MANY_REQUESTS,
            };
        }

        // 处理 HTTP 异常
        if (exception instanceof HttpException) {
            const response: any = exception.getResponse();
            return {
                message:
                    typeof response === 'string'
                        ? response
                        : (exception.message ?? 'HTTP Exception'),
                code: response.code ?? 'HTTP_EXCEPTION',
                status: exception.getStatus(),
                details: typeof response === 'object' ? (response as any).details : undefined,
            };
        }

        // 处理 Prisma 异常
        if (exception instanceof PrismaClientKnownRequestError) {
            return this.parsePrismaException(exception);
        }

        // 处理未知异常
        return {
            message: (exception as any).message ?? 'Unexpected Internal Server Error',
            code: 'UNEXPECTED_INTERNAL_SERVER_ERROR',
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            level: 'fatal',
        };
    }

    // 解析 Prisma 异常，根据错误码返回不同的响应
    private parsePrismaException(error: PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                return {
                    message: error.message,
                    code: 'UNIQUE_CONSTRAINT_VIOLATION',
                    status: HttpStatus.CONFLICT,
                    details: error.meta,
                };
            case 'P2003':
                return {
                    message: error.message,
                    code: 'FOREIGN_KEY_VIOLATION',
                    status: HttpStatus.BAD_REQUEST,
                    details: error.meta,
                };
            case 'P2025':
                return {
                    message: error.message,
                    code: 'RECORD_NOT_FOUND',
                    status: HttpStatus.NOT_FOUND,
                    details: error.meta,
                };
            default:
                return {
                    message: error.message,
                    code: 'DATABASE_ERROR',
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    details: error.meta,
                };
        }
    }
}
