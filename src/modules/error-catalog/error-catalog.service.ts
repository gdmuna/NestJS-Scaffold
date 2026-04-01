import type { ErrorCode } from './error-catalog.type.js';

import { ERROR_CATALOG } from '@/constants/error-catalog.constant.js';

import { AllConfig } from '@root/config/app.config.js';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 获取错误类型 URL
 * 支持自定义基础 URL，用于在不同环境使用不同的文档链接
 */
@Injectable()
export class ErrorCatalogService {
    private readonly baseUrl: string;
    constructor(private readonly configService: ConfigService<AllConfig, true>) {
        this.baseUrl = this.configService.get('observability.apiDocsBaseUrl', { infer: true });
    }

    /**
     * 生成错误类型的完整 URL
     * @param errorCode - 错误代码
     * @returns 完整的错误文档 URL
     *
     * 示例：
     * getErrorTypeUrl('VALIDATION_FAILED')
     * => 'https://api.example.com/errors/VALIDATION_FAILED'
     */
    getErrorTypeUrl(errorCode: ErrorCode | string): string {
        return `${this.baseUrl}/errors/${errorCode}`;
    }

    /**
     * 验证错误代码是否在目录中
     */
    isKnownError(errorCode: string): errorCode is ErrorCode {
        return errorCode in ERROR_CATALOG;
    }

    /**
     * 获取错误元数据
     */
    getErrorMetadata(errorCode: ErrorCode) {
        return ERROR_CATALOG[errorCode];
    }
}
