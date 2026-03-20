import { LoginDto } from './auth.dto.js';

import { Public } from '@/common/decorators/index.js';
import { BusinessException } from '@/common/exceptions/index.js';

import { Controller, Post, Body } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';

@Controller('auth')
export class AuthController {
    @Post('login')
    @Public()
    login(@Body() body: LoginDto) {
        // 模拟登录逻辑，实际应用中应验证用户名和密码
        if (body.username === 'admin' && body.password === 'password') {
            return {
                message: 'Login successful',
                token: 'fake-jwt-token',
            };
        } else {
            throw new BusinessException(
                'Invalid username or password',
                'AUTH_FAILED',
                HttpStatus.UNAUTHORIZED
            );
        }
    }
}
