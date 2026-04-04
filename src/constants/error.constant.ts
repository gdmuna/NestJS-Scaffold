export const ERROR_CATALOG = {
    // 验证相关错误 (4xx)
    VALIDATION_FAILED: {
        code: 'VALIDATION_FAILED',
        statusCode: 400,
        message: '请求参数验证失败',
        description: '请求的参数不符合要求，请检查字段类型、长度等限制',
    },

    // 认证相关错误 (4xx)
    UNAUTHORIZED: {
        code: 'UNAUTHORIZED',
        statusCode: 401,
        message: '未授权',
        description: '缺少或无效的认证凭据，请提供有效的 Token',
    },

    INVALID_TOKEN: {
        code: 'INVALID_TOKEN',
        statusCode: 401,
        message: 'Token 无效或已过期',
        description: '提供的 Token 格式不正确或已过期，请重新登录获取新 Token',
    },

    // 权限相关错误 (4xx)
    FORBIDDEN: {
        code: 'FORBIDDEN',
        statusCode: 403,
        message: '禁止访问',
        description: '当前用户没有权限执行此操作，请联系管理员申请权限',
    },

    INSUFFICIENT_PERMISSIONS: {
        code: 'INSUFFICIENT_PERMISSIONS',
        statusCode: 403,
        message: '权限不足',
        description: '当前用户缺少执行此操作所需的权限',
    },

    // 资源相关错误 (4xx)
    RESOURCE_NOT_FOUND: {
        code: 'RESOURCE_NOT_FOUND',
        statusCode: 404,
        message: '资源不存在',
        description: '请求的资源不存在或已被删除',
    },

    RESOURCE_CONFLICT: {
        code: 'RESOURCE_CONFLICT',
        statusCode: 409,
        message: '资源冲突',
        description: '请求与现有资源发生冲突，例如唯一性约束冲突',
    },

    // 限流相关错误 (4xx)
    RATE_LIMIT_EXCEEDED: {
        code: 'RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        message: '请求过于频繁',
        description: '您的请求超过了速率限制，请稍后重试',
    },

    // 业务逻辑相关错误 (4xx)
    BUSINESS_LOGIC_ERROR: {
        code: 'BUSINESS_LOGIC_ERROR',
        statusCode: 400,
        message: '业务逻辑错误',
        description: '请求无法完成，因为违反了业务规则或约束',
    },

    // 服务器错误 (5xx)
    INTERNAL_SERVER_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
        message: '内部服务器错误',
        description: '服务器遇到意外错误，请稍后重试或联系支持团队',
    },

    REQUEST_TIMEOUT: {
        code: 'REQUEST_TIMEOUT',
        statusCode: 408,
        message: '请求超时',
        description: '处理您的请求花费的时间过长，请稍后重试',
    },

    DATABASE_ERROR: {
        code: 'DATABASE_ERROR',
        statusCode: 500,
        message: '数据库错误',
        description: '数据库操作失败，请稍后重试',
    },

    EXTERNAL_SERVICE_ERROR: {
        code: 'EXTERNAL_SERVICE_ERROR',
        statusCode: 502,
        message: '外部服务错误',
        description: '依赖的外部服务暂时不可用，请稍后重试',
    },
} as const;
