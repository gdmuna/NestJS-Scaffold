import { Injectable } from '@nestjs/common';
import { uptime } from 'node:process';
import { PrismaService } from './common/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AppService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger
    ) {}

    getHello() {
        this.logger.trace('Handling getHello request');
        return 'Hello World!';
    }

    async getHealth() {
        const databaseHealth = await this.checkDatabaseHealth();
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: uptime(),
            version: this.configService.get('npm_package_version', 'N/A'),
            gitCommit: this.configService.get('GIT_COMMIT', 'N/A'),
            components: {
                database: {
                    ...databaseHealth,
                },
            },
        };
    }

    private async checkDatabaseHealth(timeout = 3000) {
        const start = Date.now();
        let timer: NodeJS.Timeout | null = null;
        try {
            await Promise.race([
                this.prismaService.$queryRaw`SELECT 1`,
                new Promise(
                    (_, reject) =>
                        (timer = setTimeout(() => reject(new Error('Database timeout')), timeout))
                ),
            ]);
            return {
                status: 'ok',
                responseTimeMs: Date.now() - start,
            };
        } catch (error) {
            return {
                status: 'down',
                responseTimeMs: Date.now() - start,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        } finally {
            if (timer) clearTimeout(timer);
        }
    }
}
