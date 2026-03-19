import { Injectable } from '@nestjs/common';
import { uptime } from 'node:process';
import { DatabaseService } from '@/infra/database/database.service.js';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@/common/logger.service.js';
import { APP_VERSION } from '@/app.constant.js';
import { RequestContextService } from './common/request-context.service.js';

@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name);
    constructor(
        private readonly prisma: DatabaseService,
        private readonly configService: ConfigService,
        private readonly requestContextService: RequestContextService
    ) {}

    getHello() {
        this.logger.verbose('Handling getHello request');
        this.requestContextService.mergeResponseMetadata({
            exampleKey: '666',
            ccc: { aaa: 'wtf' },
        });
        this.requestContextService.mergeResponseMetadata({ exampleKey: 'exampleValue' });
        this.requestContextService.mergeResponseMetadata({ ccc: { bbb: 'omg', aaa: '999' } });
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
                this.prisma.$queryRaw`SELECT 1`,
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
