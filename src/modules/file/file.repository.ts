import { DatabaseService } from '@/infra/database/database.service.js';

import type { FileStatus } from '@root/prisma/generated/enums.js';
import type { FileModel, FileUncheckedCreateInput } from '@root/prisma/generated/models/File.js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class FileRepository {
    constructor(private readonly db: DatabaseService) {}

    create(data: FileUncheckedCreateInput): Promise<FileModel> {
        return this.db.file.create({ data });
    }

    findById(id: string): Promise<FileModel | null> {
        return this.db.file.findUnique({ where: { id } });
    }

    // findBySha256(sha256: string): Promise<FileModel | null> {
    //     return this.db.file.findFirst({
    //         where: { sha256, status: 'ACTIVE' },
    //         orderBy: { createdAt: 'desc' },
    //     });
    // }

    updateStatus(id: string, status: FileStatus, uploadId?: string | null): Promise<FileModel> {
        return this.db.file.update({
            where: { id },
            data: { status, ...(uploadId !== undefined ? { uploadId } : {}) },
        });
    }

    softDelete(id: string): Promise<FileModel> {
        return this.db.file.update({ where: { id }, data: { status: 'DELETED' } });
    }

    softDeleteMany(ids: string[]): Promise<{ count: number }> {
        return this.db.file.updateMany({ where: { id: { in: ids } }, data: { status: 'DELETED' } });
    }
}
