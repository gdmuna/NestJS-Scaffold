import { ExceptionCatalogService } from './exception-catalog.service.js';

import { Public } from '@/common/decorators/index.js';

import { Controller, Get, Param } from '@nestjs/common';

@Public()
@Controller('errors')
export class ExceptionCatalogController {
    constructor(private readonly exceptionCatalogService: ExceptionCatalogService) {}

    @Get()
    getAllExceptions() {
        return this.exceptionCatalogService.getAllExceptionsMeta();
    }

    @Get(':exceptionCode')
    getExceptionDetail(@Param('exceptionCode') exceptionCode: string) {
        const [data, err] = this.exceptionCatalogService.getExceptionMetaByCode(exceptionCode);
        if (err) throw err;
        return data;
    }
}
