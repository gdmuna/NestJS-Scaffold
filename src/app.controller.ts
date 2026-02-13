import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Body, Post, HttpStatus, HttpException } from '@nestjs/common';
import { BusinessException } from './common/exceptions/business.exception.js';
import { LoginDto } from './app.dto.js';
import { Logger } from '@/common/logger.service.js';

@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name);
    constructor(private readonly appService: AppService) {}

    @Get('hello')
    getHello() {
        // this.logger.verbose({ message: 'wtf', ttt: 666 }, '666');
        // throw new HttpException(
        //     {
        //         message: 'Simula Internal Exception',
        //         code: 'Simula_Internal_Exception',
        //         timestamp: new Date().toISOString(),
        //     },
        //     HttpStatus.INTERNAL_SERVER_ERROR
        // );
        return this.appService.getHello();
    }

    @Get('health')
    getHealth() {
        return this.appService.getHealth();
    }

    @Post('login')
    login(@Body() body: LoginDto) {
        // 模拟登录逻辑，实际应用中应验证用户名和密码
        if (body.username === 'admin' && body.password === 'password') {
            return {
                success: true,
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
