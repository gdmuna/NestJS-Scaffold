import { APP_VERSION } from '@/constants/index.js';

import { DatabaseService } from '@/infra/database/database.service.js';

import { Logger, RequestContextService } from '@/common/services/index.js';

import { Injectable } from '@nestjs/common';
import { uptime } from 'node:process';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name);
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly configService: ConfigService,
        private readonly requestContextService: RequestContextService
    ) {}

    getHello() {
        this.logger.verbose('Handling getHello request');
        this.requestContextService.get(); // 确保上下文已初始化
        this.requestContextService.mergeContextMetadata({
            exampleKey: '666',
            ccc: { aaa: 'wtf' },
        });
        this.requestContextService.mergeContextMetadata({ exampleKey: 'exampleValue' });
        this.requestContextService.mergeContextMetadata({ ccc: { bbb: 'omg', aaa: '999' } });
        return 'Hello World!';
    }

    async getHealth() {
        const databaseHealth = await this.checkDatabaseHealth();
        return {
            status: 'ok',
            uptime: uptime(),
            version: APP_VERSION,
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
                this.databaseService.$queryRaw`SELECT 1`,
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
