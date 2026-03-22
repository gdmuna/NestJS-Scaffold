import { AppService } from './app.service.js';

import { DatabaseService } from '@/infra/database/database.service.js';

import { Public } from '@/common/decorators/index.js';
import { Logger } from '@/common/services/index.js';

import { Controller, Get } from '@nestjs/common';
import { Body, Post, HttpStatus, HttpException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name);
    constructor(private readonly appService: AppService) {}

    @Get('health')
    @Public()
    getHealth() {
        return this.appService.getHealth();
    }

    @Post('/change-logging-level')
    changeLoggerLevel(@Body('level') level: string) {
        PinoLogger.root.level = level;
        const message = `Logger level changed to [${level}]`;
        this.logger.info(message);
        return message;
    }
}
@Controller('test')
export class TestController {
    private readonly logger = new Logger(TestController.name);
    constructor(
        private readonly appService: AppService,
        private readonly databaseService: DatabaseService
    ) {}

    @Get('hello-world')
    @Public()
    getHello() {
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
            await this.databaseService.$queryRaw`
                SELECT 1
                WHERE pg_sleep(0.2) IS NULL OR true
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
            const result = await this.databaseService.$queryRaw<Array<{ result: number }>>`
                SELECT 1 as result
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
