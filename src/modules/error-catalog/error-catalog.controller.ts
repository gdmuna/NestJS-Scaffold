import { ErrorCatalogService } from './error-catalog.service.js';

import { ERROR_CATALOG } from '@/constants/index.js';

import { Public } from '@/common/decorators/index.js';

import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

@Controller('errors')
@Public()
export class ErrorCatalogController {
    constructor(private readonly errorCatalogService: ErrorCatalogService) {}

    @Get()
    getAllErrors() {
        const errors = Object.entries(ERROR_CATALOG).map(([key, metadata]) => ({
            code: metadata.code,
            statusCode: metadata.statusCode,
            message: metadata.message,
            description: metadata.description,
            typeUrl: this.errorCatalogService.getErrorTypeUrl(key as any),
        }));

        return errors;
    }

    @Get(':errorCode')
    getErrorDetail(
        @Param('errorCode') errorCode: string,
        @Res({ passthrough: true }) res: Response
    ) {
        if (!this.errorCatalogService.isKnownError(errorCode)) {
            res.status(HttpStatus.NOT_FOUND).json({
                code: 'DOCUMENTATION_NOT_FOUND',
                message: `错误类型 ${errorCode} 未定义`,
                timestamp: new Date().toISOString(),
            });
            return;
        }

        const metadata = this.errorCatalogService.getErrorMetadata(errorCode as any);

        // 返回 JSON 格式文档
        return {
            code: errorCode,
            metadata,
            typeUrl: this.errorCatalogService.getErrorTypeUrl(errorCode),
            example: {
                code: errorCode,
                message: metadata.message,
                type: this.errorCatalogService.getErrorTypeUrl(errorCode),
                timestamp: new Date().toISOString(),
                requestId: 'ulid_request_id_here',
                details: {
                    description: '具体的错误详情取决于错误类型',
                },
            },
            timestamp: new Date().toISOString(),
        };
    }
}
