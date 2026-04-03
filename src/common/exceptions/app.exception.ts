import { EXCEPTION_META_KEY, type StaticMeta } from './exception-registry.js';

import { HttpException } from '@nestjs/common';

/**
 * throw 时传入的运行时上下文。
 * 与 StaticMeta（装饰器写入）分离：StaticMeta 是类的身份契约，RuntimeContext 是本次异常的证据。
 *
 * @template TDetails details 字段的类型，由叶节点类的泛型参数约束
 */
export interface RuntimeContext<TDetails = unknown> {
    /** 本次异常的具体数据（如字段错误列表、冲突资源信息） */
    details?: TDetails;
    /** 原始底层错误，通过 Error.cause 链传递，不出现在 HTTP 响应体中 */
    cause?: Error | unknown;
    /** 动态覆盖 StaticMeta.message（可选，优先级高于装饰器中的默认消息） */
    message?: string;
    /** 限流/背压场景：客户端应等待的毫秒数，写入响应头 Retry-After */
    retryAfterMs?: number;
    /**
     * 运行时覆盖 StaticMeta.statusCode。
     * 仅供框架级异常包装（如 SysHttpException）使用，业务代码不应依赖此字段。
     */
    statusCode?: number;
    /**
     * 运行时覆盖 StaticMeta.logLevel。
     * 仅供框架级异常包装（如 SysHttpException）使用，业务代码不应依赖此字段。
     */
    logLevel?: StaticMeta['logLevel'];
}

/**
 * 所有业务异常的抽象基类。
 *
 * 设计约定：
 * - 本类及所有中间层基类必须声明为 abstract，禁止直接实例化
 * - 只有经过 @RegisterException 装饰的叶节点类才可被 new
 * - meta 由 @RegisterException 在类定义时写入，通过 new.target 在构造时自动解析
 * - 不接受 meta 参数，消除子类重复声明、消除错误码类型的中心式聚合与循环依赖
 *
 * @template TDetails 本次异常实例 details 字段的类型
 */
export abstract class AppException<TDetails = unknown> extends HttpException {
    readonly code: string;
    readonly logLevel: StaticMeta['logLevel'];
    readonly retryable: boolean;
    readonly retryAfterMs?: number;
    readonly details?: TDetails;

    constructor(context: RuntimeContext<TDetails> = {}, options?: ErrorOptions) {
        const meta: StaticMeta | undefined = Reflect.getMetadata(EXCEPTION_META_KEY, new.target);
        if (!meta) {
            throw new Error(
                `${new.target.name} 未通过 @RegisterException 注册，无法实例化。` +
                    `请在该类上添加 @RegisterException(meta) 装饰器。`
            );
        }

        super(
            {
                message: context.message ?? meta.message,
                code: meta.code,
                details: context.details ?? null,
                timestamp: new Date().toISOString(),
            },
            context.statusCode ?? meta.statusCode,
            { cause: context.cause, ...options }
        );

        // 运行时覆盖字段（statusCode / logLevel）的访问控制：
        // 仅 SystemException 子类（框架级包装类）允许使用，业务异常若误传则快速失败。
        // 注意：此处向后引用同文件中的 SystemException 是合法的——
        //   TypeScript 对函数体内的引用做全文件作用域分析；
        //   运行时构造函数被调用时模块已完成初始化，不存在 TDZ 问题。
        if (
            (context.statusCode !== undefined || context.logLevel !== undefined) &&
            !(this instanceof SystemException)
        ) {
            throw new Error(
                `RuntimeContext.statusCode / logLevel 运行时覆盖字段仅供 SystemException ` +
                    `子类使用，${this.constructor.name} 不属于 SystemException 继承分支。`
            );
        }

        this.code = meta.code;
        this.logLevel = context.logLevel ?? meta.logLevel;
        this.retryable =
            context.retryAfterMs !== null && context.retryAfterMs !== undefined
                ? true
                : meta.retryable;
        this.retryAfterMs = context.retryAfterMs;
        this.details = context.details;

        if (context.cause instanceof Error && context.cause.stack) {
            this.stack = `${this.stack}\nCaused by: ${context.cause.stack}`;
        }
    }

    /**
     * 返回完整的静态元数据（含 description / docsPath / detailsSchema）。
     * Filter 格式化响应、错误文档端点渲染时使用。
     */
    getStaticMeta(): StaticMeta {
        // 比 ErrorRegistry.get(this.code) 更语义明确，且不需要 import ErrorRegistry
        return Reflect.getMetadata(EXCEPTION_META_KEY, this.constructor);
    }
}

/**
 * 4xx 客户端错误基类。调用方的问题，客户端应修正请求。
 * 默认 logLevel: 'info'
 */
export abstract class ClientException<TDetails = unknown> extends AppException<TDetails> {}

/**
 * 5xx 基础设施错误基类。运维关注，通常不由客户端行为引起。
 * 默认 logLevel: 'error'
 */
export abstract class InfraException<TDetails = unknown> extends AppException<TDetails> {}

/**
 * 5xx 系统级致命错误基类。未预期的 bug，开发者关注。
 * 默认 logLevel: 'fatal'
 */
export abstract class SystemException<TDetails = unknown> extends AppException<TDetails> {}
