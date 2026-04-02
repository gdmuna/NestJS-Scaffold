import { AuthException, ResourceException, RegisterException } from '@/common/exceptions/index.js';

export const AuthCode = {
    USER_DUPLICATE: 'AUTH_USER_DUPLICATE',
    CREDENTIALS_INVALID: 'AUTH_CREDENTIALS_INVALID',
    TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
    TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
} as const;

@RegisterException({
    code: AuthCode.USER_DUPLICATE,
    statusCode: 409,
    message: '用户已存在',
    description: '该邮箱或用户名已被注册，请更换后重试',
    retryable: false,
    logLevel: 'info',
})
export class DuplicateUserException extends ResourceException {}

@RegisterException({
    code: AuthCode.CREDENTIALS_INVALID,
    statusCode: 401,
    message: '用户名或密码错误',
    description: '提供的账号或密码不匹配任何已知账户，请检查后重试',
    retryable: false,
    logLevel: 'info',
})
export class InvalidCredentialsException extends AuthException {}

@RegisterException({
    code: AuthCode.TOKEN_INVALID,
    statusCode: 401,
    message: 'Token 无效或已过期',
    description: '提供的 Token 格式不正确、签名验证失败或已过期，请重新登录',
    retryable: false,
    logLevel: 'info',
})
export class InvalidTokenException extends AuthException {}

@RegisterException({
    code: AuthCode.TOKEN_MISSING,
    statusCode: 401,
    message: '缺少访问令牌',
    description: '请求头中未提供有效的 Bearer Token，请先登录',
    retryable: false,
    logLevel: 'info',
})
export class MissingTokenException extends AuthException {}
