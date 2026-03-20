import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import merge from 'lodash/merge.js';
import cloneDeep from 'lodash/cloneDeep.js';

export interface RequestContext {
    requestId: string;
    userId?: string;
    version?: string;
    time: number;
    metadata?: Record<string, any>;
}

@Injectable()
export class RequestContextService {
    private asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

    // 设置当前请求上下文
    run(context: RequestContext, callback: () => void) {
        this.asyncLocalStorage.run(context, callback);
    }

    // 获取当前请求上下文的深拷贝
    get() {
        return cloneDeep(this.asyncLocalStorage.getStore());
    }

    // 获取当前请求的原始上下文
    private getOriginContext() {
        return this.asyncLocalStorage.getStore();
    }

    // 获取 requestId
    getRequestId() {
        return this.get()?.requestId;
    }

    //合并新的metadata到当前上下文
    mergeResponseMetadata(metadata: Record<string, any>) {
        const context = this.getOriginContext();
        if (!context) return;
        context.metadata = merge(context.metadata, metadata);
        return context.metadata;
    }
}
