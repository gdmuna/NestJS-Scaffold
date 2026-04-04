import { AuthExceptionCode } from '@/modules/auth/auth.exception.js';

import {
    ErrorRegistry,
    SystemExceptionCode,
    ClientExceptionCode,
} from '@/common/exceptions/index.js';

import { API_DOCS_BASE_URL, APP_VERSION } from '@/constants/index.js';

import { applyDecorators, Type } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ulid } from 'ulid';

// ─── 元数据键 ─────────────────────────────────────────────────────────────────

/** 认证策略的元数据键，供 AuthGuard 读取 */
export const AUTH_STRATEGY_KEY = 'auth:strategy';

/** 认证策略类型枚举 */
export type AUTH_STRATEGY_TYPE = 'public' | 'optional' | 'required';

/** 路由错误码声明列表的元数据键，供 OpenAPI 富化器读取 */
export const ROUTE_ERRORS_KEY = 'route:errors';

/**
 * 所有路由自动追加的错误码。
 * 对应类在 @/common/exceptions/client.exception.ts 与 system.exception.ts 中注册，
 * 随 ErrorRegistry 导入自动就位。
 */
// const BASE_ERROR_CODES = [
//     'CLIENT_REQUEST_RATE_LIMIT_EXCEEDED', // 429
//     'SYS_UNEXPECTED_ERROR', // 500
// ] as const;

const BASE_ERROR_CODES = [
    ...Object.values(ClientExceptionCode),
    ...Object.values(SystemExceptionCode),
] as const;

export interface ApiRouteOptions {
    /** 认证策略（默认 'required'） */
    auth: AUTH_STRATEGY_TYPE;
    /** Swagger 操作摘要（必填），显示在端点标题 */
    summary: string;
    /** 接口详细说明，支持 Markdown */
    description?: string;
    /**
     * 成功响应的 DTO 类型。
     * 装饰器将自动包裹入 ResponseFormatInterceptor 的统一包络：
     * `{ success: true, data: <responseType>, timestamp, context }`
     */
    responseType?: Type<unknown>;
    /** 成功响应的 HTTP 状态码（默认 200） */
    successStatus?: number;
    /**
     * 该路由可能抛出的业务错误码列表（ErrorRegistry 中已注册的 code 字符串）。
     *
     * 以下错误码无需声明，装饰器自动追加：
     * - CLIENT_REQUEST_RATE_LIMIT_EXCEEDED（所有路由）
     * - SYS_UNEXPECTED_ERROR（所有路由）
     *
     * auth='required' 路由的认证失败错误（AUTH_TOKEN_MISSING、AUTH_TOKEN_INVALID）
     * 由各路由按需在此处手动声明，确保与异常注册加载顺序解耦。
     */
    errors?: string[];
    /** 标记为已废弃接口 */
    deprecated?: boolean;
}

/**
 * 路由契约装饰器——将认证策略、Swagger 文档、错误声明聚合为单次声明。
 *
 * 消费层分工：
 * - `SetMetadata(AUTH_STRATEGY_KEY)` → `AuthGuard` 通过 Reflector 读取，决定放行/拦截
 * - `SetMetadata(ROUTE_ERRORS_KEY)`  → OpenAPI 富化阶段读取，生成错误响应文档（当前由 buildErrorApiResponses 直接生成）
 * - `ApiOperation / ApiResponse`     → `@nestjs/swagger` 直接消费，写入 OpenAPI spec
 *
 * @example
 * // 公开路由
 * \@ApiRoute({ auth: 'public', summary: '获取所有错误码' })
 *
 * // 需认证路由，显式声明业务错误
 * \@ApiRoute({
 *   summary: '创建用户',
 *   responseType: UserDto,
 *   errors: ['AUTH_USER_DUPLICATE', 'AUTH_TOKEN_MISSING', 'AUTH_TOKEN_INVALID'],
 * })
 */
export const ApiRoute = (options: ApiRouteOptions) => {
    const auth = options.auth ?? 'required';
    //prettier-ignore
    const EXTERNAL_ERROR_CODES =
        auth === 'required'
            ? [
                AuthExceptionCode.TOKEN_MISSING,
                AuthExceptionCode.TOKEN_INVALID,
            ] : [];

    const allErrorCodes = [
        ...new Set([...(options.errors ?? []), ...BASE_ERROR_CODES, ...EXTERNAL_ERROR_CODES]),
    ];

    return applyDecorators(
        // 1. 认证元数据
        SetMetadata(AUTH_STRATEGY_KEY, auth),
        // 2. 错误码元数据（供富化器消费）
        SetMetadata(ROUTE_ERRORS_KEY, allErrorCodes),
        // 3. Swagger 操作说明
        ApiOperation({
            summary: options.summary,
            description: options.description,
            deprecated: options.deprecated,
        }),
        // 4. 成功响应包络（有 responseType 时展开）
        ...(options.responseType
            ? [buildSuccessApiResponse(options.responseType, options.successStatus ?? 200)]
            : []),
        // 5. 错误响应（按 statusCode 分组，从 ErrorRegistry 查询）
        ...buildErrorApiResponses(allErrorCodes),
        // 6. Bearer 认证标识（非公开路由）
        ...(auth !== 'public' ? [ApiBearerAuth('accessToken')] : [])
    );
};

/**
 * 构造成功响应 ApiResponse 装饰器。
 * 包络结构由 wrapSuccessResponses 文档后处理统一注入，此处只声明裸 DTO 类型。
 */
function buildSuccessApiResponse(dto: Type<unknown>, status: number) {
    return ApiResponse({ status, type: dto, description: '操作成功' });
}

/**
 * 根据 ErrorRegistry 将错误码按 statusCode 分组，
 * 同组多个错误以 OpenAPI examples 区分，生成对应的 ApiResponse 装饰器列表。
 *
 * 未在 ErrorRegistry 中注册的错误码（如加载顺序问题导致的空值）会被静默跳过，
 * 仍存储于 ROUTE_ERRORS_KEY 元数据中供后续富化器使用。
 */
function buildErrorApiResponses(codes: readonly string[]) {
    const grouped = new Map<number, { code: string; message: string }[]>();

    for (const code of codes) {
        const meta = ErrorRegistry.get(code);
        if (!meta) continue; // 未注册（可能尚未加载），静默跳过

        const list = grouped.get(meta.statusCode) ?? [];
        list.push({ code: meta.code, message: meta.message });
        grouped.set(meta.statusCode, list);
    }

    return [...grouped.entries()].map(([statusCode, entries]) =>
        ApiResponse({
            status: statusCode,
            description: entries.map((e) => e.message).join(' / '),
            content: {
                'application/json': {
                    examples: Object.fromEntries(
                        entries.map(({ code, message }) => [
                            code,
                            {
                                summary: message,
                                value: {
                                    success: false,
                                    code,
                                    message,
                                    type: `${API_DOCS_BASE_URL}/${code}`,
                                    timestamp: new Date().toISOString(),
                                    context: {
                                        requestId: ulid(),
                                        time: Date.now(),
                                        version: APP_VERSION,
                                        metadata: {},
                                    },
                                    details: null,
                                },
                            },
                        ])
                    ),
                },
            },
        })
    );
}
