// 1. 创建请求上下文服务
// src/common/request-context.service.ts
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
    requestId: string;
    userId?: string;
    version: string;
    timestamp: number;
    // 其他需要传递的上下文
}

@Injectable()
export class RequestContextService {
    private static asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

    // 设置当前请求上下文
    static run(context: RequestContext, callback: () => void) {
        this.asyncLocalStorage.run(context, callback);
    }

    // 获取当前请求上下文
    static get(): RequestContext | undefined {
        return this.asyncLocalStorage.getStore();
    }

    // 获取 requestId
    static getRequestId(): string | undefined {
        return this.get()?.requestId;
    }
}
