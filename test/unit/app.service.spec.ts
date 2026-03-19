import { AppService } from '@/app.service.js';
import { DatabaseService } from '@/infra/database/database.service.js';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { RequestContextService } from '@/common/request-context.service.js';

// Mock PinoLogger
const mockPinoLogger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
};

describe('AppService', () => {
    let service: AppService;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
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
        service = module.get(AppService);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return "Hello World!" from getHello()', () => {
        expect(service.getHello()).toBe('Hello World!');
    });

    it('getHealth should return status ok and timestamp', async () => {
        const res: any = await service.getHealth();
        expect(res).toHaveProperty('status', 'ok');
    });
});
