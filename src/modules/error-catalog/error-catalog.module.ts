import { Module } from '@nestjs/common';
import { ErrorCatalogController } from '@/modules/error-catalog/error-catalog.controller.js';
import { ErrorCatalogService } from '@/modules/error-catalog/error-catalog.service.js';

@Module({
    controllers: [ErrorCatalogController],
    providers: [ErrorCatalogService],
    exports: [ErrorCatalogService],
})
export class ErrorCatalogModule {}
