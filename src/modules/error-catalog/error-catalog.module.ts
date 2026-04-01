import { ErrorCatalogController } from './error-catalog.controller.js';
import { ErrorCatalogService } from './error-catalog.service.js';

import { Module } from '@nestjs/common';

@Module({
    controllers: [ErrorCatalogController],
    providers: [ErrorCatalogService],
    exports: [ErrorCatalogService],
})
export class ErrorCatalogModule {}
