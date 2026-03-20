import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const UserDtoSchema = z.object({
    id: z.string().meta({ example: '123' }),
    username: z.string().meta({
        description: '用户名',
        example: 'john_doe',
    }),
    password: z.string().meta({
        description: '密码（创建/登录时必需）',
        example: 'P@ssw0rd!',
    }),
    email: z.email().meta({
        description: '邮箱地址',
        example: 'user@example.com',
    }),
});

export class UserDto extends createZodDto(UserDtoSchema) {}

const LoginDtoSchema = UserDtoSchema.pick({
    username: true,
    password: true,
}).meta({ description: '登录请求体' });

export class LoginDto extends createZodDto(LoginDtoSchema) {}
