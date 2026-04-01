import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const RegisterDtoSchema = z
    .object({
        username: z.string().min(3).max(32).meta({
            description: '用户名',
            example: 'john_doe',
        }),
        email: z.email().meta({
            description: '邮箱',
            example: 'john@example.com',
        }),
        password: z.string().min(8).max(128).meta({
            description: '密码',
            example: 'P@ssw0rd!',
        }),
    })
    .meta({ description: '注册请求体' });

export class RegisterDto extends createZodDto(RegisterDtoSchema) {}

const LoginDtoSchema = z
    .object({
        account: z.string().min(1).max(128).meta({
            description: '用户名或邮箱',
            example: 'john_doe',
        }),
        password: z.string().min(8).max(128).meta({
            description: '密码',
            example: 'P@ssw0rd!',
        }),
    })
    .meta({ description: '登录请求体' });

export class LoginDto extends createZodDto(LoginDtoSchema) {}

const AccessTokenDtoSchema = z
    .object({
        accessToken: z.string().min(1).meta({
            description: '访问令牌',
            example: 'eyJhbGciOi...',
        }),
    })
    .meta({ description: '访问令牌响应体' });

export class AccessTokenDto extends createZodDto(AccessTokenDtoSchema) {}

const AuthUserDtoSchema = z
    .object({
        id: z.string().meta({
            description: '用户 ID',
            example: 'cm01abcxyz',
        }),
        username: z.string().meta({
            description: '用户名',
            example: 'john_doe',
        }),
        email: z.email().meta({
            description: '邮箱',
            example: 'john@example.com',
        }),
    })
    .meta({ description: '认证用户信息' });

const AuthResponseDtoSchema = z
    .object({
        accessToken: z.string().min(1).meta({
            description: '访问令牌',
            example: 'eyJhbGciOi...',
        }),
        user: AuthUserDtoSchema,
    })
    .meta({ description: '登录/注册响应体' });

export class AuthResponseDto extends createZodDto(AuthResponseDtoSchema) {}
