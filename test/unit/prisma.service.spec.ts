import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '@/infra/database/database.service.js';
import { RequestContextService } from '@/common/request-context.service.js';

describe('DatabaseService', () => {
    let service: DatabaseService;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [DatabaseService, RequestContextService],
        }).compile();
        service = module.get(DatabaseService);
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
