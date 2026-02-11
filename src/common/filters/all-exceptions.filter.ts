import { BussinessException } from '@/common/exceptions/business.exception.js';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request as originRequest, Response } from 'express';
import { PrismaClientKnownRequestError } from '@root/prisma/generated/internal/prismaNamespace.js';
import { ZodValidationException, ZodSerializationException } from 'nestjs-zod';
import { ZodError } from 'zod/v4';
import { ThrottlerException } from '@nestjs/throttler';
import { Logger } from '@nestjs/common';

interface Request extends originRequest {
    user?: any;
}

/**
 * @description: 全局异常过滤器，捕获所有未处理的异常并返回统一格式的错误响应
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const { message, code, statusCode, details } = this.parseException(exception);

        const logContext = {
            error: {
                type: exception?.constructor?.name ?? 'Unknown',
                code,
                message,
                status: statusCode,
            },
            ...(request.user && {
                user: {
                    id: request.user.id,
                    username: request.user.username,
                },
            }),
            details,
        };

        if (statusCode >= 500) {
            this.logger.error(
                {
                    ...logContext,
                    stack: exception instanceof Error ? exception.stack : undefined,
                },
                `Internal error: ${message}`
            );
        } else if (statusCode === 429) {
            // 限流 - warn 级别
            this.logger.warn(logContext, `Rate limit exceeded: ${message}`);
        } else if (statusCode >= 400) {
            // 其他客户端错误 - info 级别
            this.logger.log(logContext, `Client error: ${message}`);
        } else {
            // 其他情况 - fatal 级别
            this.logger.fatal(logContext, `Unexpected exception: ${message}`);
        }

        const exceptionRes = {
            success: false,
            code,
            message,
            url: request.url,
            timestamp: new Date().toISOString(),
            details,
        };
        response.status(statusCode).json(exceptionRes);
    }

    // 解析异常，区分不同类型的异常并提取相关信息
    private parseException(exception: unknown) {
        // 处理业务异常
        if (exception instanceof BussinessException) {
            return {
                message: exception.message,
                code: exception.code,
                statusCode: exception.httpStatus,
                details: exception.details,
            };
        }

        // 处理请求参数验证异常
        if (exception instanceof ZodValidationException) {
            const zodError = exception.getZodError() as ZodError;
            return {
                message: 'Bad Request',
                code: 'VALIDATION_FAILED',
                statusCode: HttpStatus.BAD_REQUEST,
                details: zodError.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                })),
            };
        }

        // 处理响应序列化异常
        if (exception instanceof ZodSerializationException) {
            return {
                message: 'Internal Server Error',
                code: 'SERIALIZATION_ERROR',
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            };
        }

        if (exception instanceof ThrottlerException) {
            return {
                message: exception.message,
                code: 'TOO_MANY_REQUESTS',
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
            };
        }

        // 处理 HTTP 异常
        if (exception instanceof HttpException) {
            const response = exception.getResponse();
            return {
                message: typeof response === 'string' ? response : (response as any).message,
                code: (response as any).code ?? 'HTTP_EXCEPTION',
                statusCode: exception.getStatus(),
                details: typeof response === 'object' ? (response as any).details : undefined,
            };
        }

        // 处理 Prisma 异常
        if (exception instanceof PrismaClientKnownRequestError) {
            return this.parsePrismaException(exception);
        }

        // 处理未知异常
        return {
            message: (exception as any).message ?? 'Unknown Internal Server Error',
            code: 'INTERNAL_SERVER_ERROR',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
    }

    // 解析 Prisma 异常，根据错误码返回不同的响应
    private parsePrismaException(error: PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                return {
                    message: error.message,
                    code: 'UNIQUE_CONSTRAINT_VIOLATION',
                    statusCode: HttpStatus.CONFLICT,
                    details: error.meta,
                };
            case 'P2003':
                return {
                    message: error.message,
                    code: 'FOREIGN_KEY_VIOLATION',
                    statusCode: HttpStatus.BAD_REQUEST,
                    details: error.meta,
                };
            case 'P2025':
                return {
                    message: error.message,
                    code: 'RECORD_NOT_FOUND',
                    statusCode: HttpStatus.NOT_FOUND,
                    details: error.meta,
                };
            default:
                return {
                    message: error.message,
                    code: 'DATABASE_ERROR',
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    details: error.meta,
                };
        }
    }
}
