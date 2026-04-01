import { PrismaClient } from '@root/prisma/generated/client.js';

import { SLOW_QUERY_THRESHOLDS } from '@/constants/index.js';

import { Logger, RequestContextService } from '@/common/services/index.js';

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * @description Prisma 数据库服务
 * - 管理数据库连接生命周期
 * - 监控慢查询并记录日志
 * - 开发环境下记录所有 SQL 查询
 */
@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleDestroy, OnModuleInit {
    private readonly logger = new Logger(DatabaseService.name);

    constructor(private readonly requestContextService: RequestContextService) {
        const DATABASE_URL = process.env.DATABASE_URL;
        if (!DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set');
        }
        const adapter = new PrismaPg({
            connectionString: DATABASE_URL,
            max: 12,
            min: 2, // 最小保持 2 个连接
            idleTimeoutMillis: 30000, // 30秒空闲超时
            connectionTimeoutMillis: 2000, // 2秒连接超时
        });

        // 开发环境启用查询日志
        super({
            adapter,
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'warn' },
            ],
        });
    }

    async onModuleInit() {
        // 连接数据库
        await this.$connect();
        this.logger.log('Database connected successfully');

        // 订阅查询事件（用于慢查询监控）
        this.$on('query' as never, (event: any) => {
            this.handleQueryEvent(event);
        });

        // 订阅错误事件
        this.$on('error' as never, (event: any) => {
            const requestContext = this.requestContextService.get();
            this.logger.error(
                {
                    requestId: requestContext?.requestId || 'unknown',
                    version: requestContext?.version || 'unknown',
                    database: {
                        target: event.target ?? 'Unknown',
                        timestamp: event.timestamp ?? new Date().toISOString(),
                    },
                    error: {
                        message: event.message ?? 'Unknown error',
                    },
                },
                `Database error occurred\n${event.stack ?? 'No stack trace available'}`
            );
        });

        // 订阅警告事件
        this.$on('warn' as never, (event: any) => {
            const requestContext = this.requestContextService.get();
            this.logger.warn(
                {
                    requestId: requestContext?.requestId || 'unknown',
                    version: requestContext?.version || 'unknown',
                    database: {
                        message: event.message ?? 'Unknown error',
                        timestamp: event.timestamp ?? new Date().toISOString(),
                    },
                },
                `Database warning\n${event.stack ?? 'No stack trace available'}`
            );
        });
    }

    // 处理查询事件，检测慢查询并记录日志
    private handleQueryEvent(event: {
        timestamp: Date;
        query: string;
        params: string;
        duration: number;
        target: string;
    }) {
        const requestContext = this.requestContextService.get();
        const { query, params, target, timestamp } = event;
        const duration = Math.round(event.duration);

        // 解析参数（Prisma 返回的是 JSON 字符串）
        let parsedParams: any[] = [];
        try {
            parsedParams = JSON.parse(params);
        } catch {
            parsedParams = params as any;
        }

        // 构造日志上下文
        const logContext = {
            requestId: requestContext?.requestId || 'unknown',
            version: requestContext?.version || 'unknown',
            database: {
                target, // 例如：prisma:query
                duration,
                durationUnit: 'ms',
                timestamp: timestamp.toISOString(),
            },
            query: {
                sql: this.formatSql(query),
                params: this.sanitizeParams(parsedParams),
            },
        };

        // 根据查询耗时选择日志级别
        if (duration >= SLOW_QUERY_THRESHOLDS.error) {
            // 超过 500ms：error 级别
            this.logger.error(
                logContext,
                `Critical slow query (${duration}ms)\n${this.formatSql(query)}`
            );
        } else if (duration >= SLOW_QUERY_THRESHOLDS.warn) {
            // 超过 100ms：warn 级别
            this.logger.warn(logContext, `Slow query (${duration}ms)\n${this.formatSql(query)}`);
        } else {
            // 所有查询：debug 级别
            this.logger.debug(logContext, `Query executed (${duration}ms)`);
        }
    }

    // 格式化 SQL 语句
    private formatSql(sql: string): string {
        return sql
            .split('\n') // 按行分割
            .map((line) => line.trim()) // 每行去掉首尾空格
            .filter((line) => line.length > 0) // 去掉空行
            .join('\n'); // 重新组合
    }
    // 脱敏查询参数（避免记录敏感信息）
    private sanitizeParams(params: any[]): any[] {
        if (!params || params.length === 0) return [];

        return params.map((param) => {
            if (typeof param === 'string') {
                // 检测是否为敏感字段（密码、token 等）
                if (
                    param.toLowerCase().includes('password') ||
                    param.toLowerCase().includes('token') ||
                    param.toLowerCase().includes('secret')
                ) {
                    return '[REDACTED]';
                }
                // 限制字符串长度
                return param.length > 100 ? param.substring(0, 100) + '...' : param;
            }
            return param;
        });
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Database disconnected');
    }
}
