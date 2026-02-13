import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Body, Post, HttpStatus, HttpException } from '@nestjs/common';
import { BusinessException } from './common/exceptions/business.exception.js';
import { LoginDto } from './app.dto.js';
import { Logger } from '@/common/logger.service.js';
import { PinoLogger } from 'nestjs-pino';
import { DatabaseService } from '@/common/database.service.js';

@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name);
    constructor(private readonly appService: AppService) {}

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

    @Post('/change-logging-level')
    changeLoggerLevel(@Body('level') level: string) {
        PinoLogger.root.level = level;
        this.logger.info(`Logger level changed to [${level}]`);
    }
}
@Controller('test')
export class TestController {
    private readonly logger = new Logger(TestController.name);
    constructor(
        private readonly appService: AppService,
        private readonly prisma: DatabaseService
    ) {}

    @Get('hello-world')
    getHello() {
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

    @Get('simulate-error')
    simulateError() {
        throw new HttpException(
            {
                message: 'Simula Internal Exception',
                code: 'Simula_Internal_Exception',
                timestamp: new Date().toISOString(),
            },
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }

    /**
     * 模拟慢请求（2 秒延迟）
     */
    @Get('slow-request')
    async slowRequest() {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return { message: 'This request took 2 seconds' };
    }

    /**
     * 模拟超慢请求（4 秒延迟）
     */
    @Get('very-slow-request')
    async verySlowRequest() {
        await new Promise((resolve) => setTimeout(resolve, 4000));
        return { message: 'This request took 4 seconds' };
    }

    /**
     * 模拟慢查询（使用 pg_sleep）
     * 注意：需要数据库连接才能测试
     */
    @Get('slow-query')
    async slowQuery() {
        try {
            // 执行一个耗时 200ms 的查询，pg_sleep 在 WHERE 子句中执行避免返回 void
            await this.prisma.$queryRaw`
                SELECT 1
                -- WHERE pg_sleep(0.2) IS NULL OR true
            `;
            return {
                message: 'Slow query executed (200ms)',
            };
        } catch (error: any) {
            return {
                message: 'Database error',
                error: error.message,
            };
        }
    }

    /**
     * 模拟超慢查询（600ms）
     */
    @Get('very-slow-query')
    async verySlowQuery() {
        try {
            // 执行一个耗时 600ms 的查询
            const result = await this.prisma.$queryRaw<Array<{ result: number }>>`
                SELECT 1 as result
                FROM (VALUES (1)) AS t(x)
                WHERE pg_sleep(0.6) IS NULL OR true
            `;
            return {
                message: 'Very slow query executed (600ms)',
                queryResult: result[0]?.result,
            };
        } catch (error: any) {
            return {
                message: 'Database error',
                error: error.message,
            };
        }
    }
}
