import { DatabaseService } from '@/infra/database/database.service.js';

import type { FileStatus } from '@root/prisma/generated/enums.js';
import type { FileModel } from '@root/prisma/generated/models/File.js';

import { Injectable } from '@nestjs/common';

export interface CreateFileInput {
    userId: string;
    domain: string;
    bucket: string;
    key: string;
    filename: string;
    contentType: string;
    uploadId?: string;
    sha256?: string;
}

@Injectable()
export class FileRepository {
    constructor(private readonly db: DatabaseService) {}

    create(data: CreateFileInput): Promise<FileModel> {
        return this.db.file.create({ data });
    }

    findById(id: string): Promise<FileModel | null> {
        return this.db.file.findUnique({ where: { id } });
    }

    findBySha256(sha256: string): Promise<FileModel | null> {
        return this.db.file.findFirst({
            where: { sha256, status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
        });
    }

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
