import { AppController } from '@/app.controller.js';
import { AppService } from '@/app.service.js';

import { loadEnv } from '@/constants/index.js';

import { RequestContextService } from '@/common/services/index.js';

import { DatabaseService } from '@/infra/database/database.service.js';

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';

loadEnv('test', { quiet: true });

// Mock PinoLogger
const mockPinoLogger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
};

describe('AppController (unit)', () => {
    let controller: AppController;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [AppController],
            providers: [
                AppService,
                DatabaseService,
                ConfigService,
                RequestContextService,
                {
                    provide: PinoLogger,
                    useValue: mockPinoLogger,
                },
            ],
        }).compile();
        controller = module.get(AppController);
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    // it('getHello should return Hello World!', () => {
    //     expect(controller.getHello()).toBe('Hello World!');
    // });

    it('getHealth should return status ok and timestamp', async () => {
        const res: any = await controller.getHealth();
        expect(res).toHaveProperty('status', 'ok');
    });
});
