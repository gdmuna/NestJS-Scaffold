import { FileService } from '@/modules/file/file.service.js';
import { FileRepository } from '@/modules/file/file.repository.js';
import { AvatarStrategy } from '@/modules/file/strategies/avatar.strategy.js';
import { VideoStrategy } from '@/modules/file/strategies/video.strategy.js';
import { DocumentStrategy } from '@/modules/file/strategies/document.strategy.js';
import {
    FileInvalidDomainException,
    FileInvalidTypeException,
    FileRecordNotFoundException,
    FileStagingNotFoundException,
} from '@/modules/file/file.exception.js';
import type { StorageService } from '@/infra/storage/storage.service.js';
import { Readable } from 'stream';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockStorageService: jest.Mocked<
    Pick<
        StorageService,
        | 'getUploadUrl'
        | 'getUploadUrlCAS'
        | 'getDownloadUrl'
        | 'getPublicUrl'
        | 'putObject'
        | 'getObject'
        | 'getObjectStream'
        | 'getObjectSize'
        | 'deleteObject'
        | 'deleteObjects'
        | 'objectExists'
        | 'copyObject'
        | 'promoteFromStaging'
        | 'initMultipartUpload'
        | 'getResumablePartUrls'
        | 'completeMultipartUpload'
        | 'abortMultipartUpload'
    > & { stagingBucket: string }
> = {
    getUploadUrl: jest.fn(),
    getUploadUrlCAS: jest.fn(),
    getDownloadUrl: jest.fn(),
    getPublicUrl: jest.fn(),
    putObject: jest.fn(),
    getObject: jest.fn(),
    getObjectStream: jest.fn(),
    getObjectSize: jest.fn(),
    deleteObject: jest.fn(),
    deleteObjects: jest.fn(),
    objectExists: jest.fn(),
    copyObject: jest.fn(),
    promoteFromStaging: jest.fn(),
    initMultipartUpload: jest.fn(),
    getResumablePartUrls: jest.fn(),
    completeMultipartUpload: jest.fn(),
    abortMultipartUpload: jest.fn(),
    stagingBucket: 'nestjs-scaffold-staging',
};

const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
};

const mockFileRepo: jest.Mocked<
    Pick<FileRepository, 'create' | 'findById' | 'updateStatus' | 'softDelete' | 'softDeleteMany'>
> = {
    create: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    softDelete: jest.fn(),
    softDeleteMany: jest.fn(),
};

const mockAvatarStrategy = new AvatarStrategy();
const mockVideoStrategy = new VideoStrategy();
const mockDocumentStrategy = new DocumentStrategy();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildService() {
    return new FileService(
        mockStorageService as unknown as StorageService,
        mockFileRepo as unknown as FileRepository,
        mockAvatarStrategy,
        mockDocumentStrategy,
        mockVideoStrategy,
        mockCacheManager as any
    );
}

function makeFileRecord(overrides: Partial<Record<string, any>> = {}) {
    return {
        id: 'file_1',
        userId: 'u_1',
        domain: 'avatar',
        bucket: 'public',
        key: 'avatars/u_1/123.png',
        filename: 'photo.png',
        contentType: 'image/png',
        status: 'ACTIVE',
        uploadId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    } as any;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('FileService', () => {
    let service: FileService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCacheManager.set.mockResolvedValue(undefined);
        mockCacheManager.del.mockResolvedValue(undefined);
        mockCacheManager.get.mockResolvedValue(undefined);
        service = buildService();
    });

    // ── getPresignedUploadUrl ─────────────────────────────────────────────────

    describe('getPresignedUploadUrl', () => {
        it('should return fileId and uploadUrl for avatar domain', async () => {
            mockStorageService.getUploadUrl.mockResolvedValue('https://s3.example.com/presign');
            mockFileRepo.create.mockResolvedValue(makeFileRecord({ id: 'file_new' }));

            const result = await service.getPresignedUploadUrl('u_1', {
                domain: 'avatar',
                contentType: 'image/png',
                filename: 'photo.png',
            } as any);

            expect(result).toEqual({
                fileId: 'file_new',
                uploadUrl: 'https://s3.example.com/presign',
            });
            expect(mockStorageService.getUploadUrl).toHaveBeenCalledWith(
                'public',
                expect.stringContaining('avatars/u_1/'),
                'image/png'
            );
            expect(mockFileRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 'u_1', domain: 'avatar', bucket: 'public' })
            );
        });

        it('should return fileId and uploadUrl for video domain', async () => {
            mockStorageService.getUploadUrl.mockResolvedValue('https://s3.example.com/video');
            mockFileRepo.create.mockResolvedValue(
                makeFileRecord({ id: 'file_video', domain: 'video', bucket: 'private' })
            );

            const result = await service.getPresignedUploadUrl('u_2', {
                domain: 'video',
                contentType: 'video/mp4',
                filename: 'clip.mp4',
            } as any);

            expect(result.fileId).toBe('file_video');
            expect(mockStorageService.getUploadUrl).toHaveBeenCalledWith(
                'private',
                expect.stringContaining('videos/u_2/'),
                'video/mp4'
            );
        });

        it('should throw FileInvalidDomainException for unknown domain', async () => {
            await expect(
                service.getPresignedUploadUrl('u_1', {
                    domain: 'unknown',
                    contentType: 'image/png',
                    filename: 'photo.png',
                } as any)
            ).rejects.toBeInstanceOf(FileInvalidDomainException);
        });

        it('should throw FileInvalidTypeException for invalid content type', async () => {
            await expect(
                service.getPresignedUploadUrl('u_1', {
                    domain: 'avatar',
                    contentType: 'video/mp4',
                    filename: 'video.mp4',
                } as any)
            ).rejects.toBeInstanceOf(FileInvalidTypeException);
        });

        it('should use CAS flow when sha256 is provided', async () => {
            const sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
            mockStorageService.getUploadUrlCAS.mockResolvedValue(
                'https://s3.example.com/staging/presign'
            );
            mockFileRepo.create.mockResolvedValue(makeFileRecord({ id: 'file_cas', sha256 }));

            const result = await service.getPresignedUploadUrl('u_1', {
                domain: 'avatar',
                contentType: 'image/png',
                filename: 'photo.png',
                sha256,
            } as any);

            expect(result).toEqual({
                fileId: 'file_cas',
                uploadUrl: 'https://s3.example.com/staging/presign',
            });
            expect(mockStorageService.getUploadUrlCAS).toHaveBeenCalledWith(sha256, 'image/png');
            expect(mockStorageService.getUploadUrl).not.toHaveBeenCalled();
            expect(mockCacheManager.set).toHaveBeenCalledWith(
                `cas:pending:file_cas`,
                sha256,
                expect.any(Number)
            );
        });
    });

    // ── confirmUpload ─────────────────────────────────────────────────────────

    describe('confirmUpload', () => {
        it('should activate file record (non-CAS)', async () => {
            const record = makeFileRecord({ status: 'PENDING' });
            const activeRecord = makeFileRecord({ status: 'ACTIVE' });
            mockFileRepo.findById.mockResolvedValue(record);
            mockFileRepo.updateStatus.mockResolvedValue(activeRecord);

            const result = await service.confirmUpload({ fileId: 'file_1' } as any);

            expect(result.status).toBe('ACTIVE');
            expect(mockFileRepo.updateStatus).toHaveBeenCalledWith('file_1', 'ACTIVE');
        });

        it('should promote from staging and activate for CAS flow', async () => {
            const sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
            const record = makeFileRecord({ status: 'PENDING', sha256 });
            const activeRecord = makeFileRecord({ status: 'ACTIVE', sha256 });
            mockFileRepo.findById.mockResolvedValue(record);
            mockStorageService.objectExists.mockResolvedValue(true);
            mockStorageService.promoteFromStaging.mockResolvedValue(undefined);
            mockFileRepo.updateStatus.mockResolvedValue(activeRecord);

            const result = await service.confirmUpload({ fileId: 'file_1' } as any);

            expect(mockStorageService.objectExists).toHaveBeenCalledWith(
                'nestjs-scaffold-staging',
                sha256
            );
            expect(mockStorageService.promoteFromStaging).toHaveBeenCalledWith(
                sha256,
                record.bucket,
                record.key
            );
            expect(mockCacheManager.del).toHaveBeenCalledWith('cas:pending:file_1');
            expect(result.status).toBe('ACTIVE');
        });

        it('should throw FileStagingNotFoundException when staging object missing', async () => {
            const sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
            mockFileRepo.findById.mockResolvedValue(makeFileRecord({ sha256 }));
            mockStorageService.objectExists.mockResolvedValue(false);

            await expect(service.confirmUpload({ fileId: 'file_1' } as any)).rejects.toBeInstanceOf(
                FileStagingNotFoundException
            );
            expect(mockStorageService.promoteFromStaging).not.toHaveBeenCalled();
        });

        it('should throw FileRecordNotFoundException for unknown fileId', async () => {
            mockFileRepo.findById.mockResolvedValue(null);

            await expect(
                service.confirmUpload({ fileId: 'nonexistent' } as any)
            ).rejects.toBeInstanceOf(FileRecordNotFoundException);
        });
    });

    // ── getPresignedDownloadUrl ───────────────────────────────────────────────

    describe('getPresignedDownloadUrl', () => {
        it('should return download presigned URL', async () => {
            mockFileRepo.findById.mockResolvedValue(
                makeFileRecord({ domain: 'video', bucket: 'private', key: 'videos/u_1/123.mp4' })
            );
            mockStorageService.getDownloadUrl.mockResolvedValue('https://s3.example.com/download');

            const result = await service.getPresignedDownloadUrl({
                fileId: 'file_1',
                expiresIn: 7200,
            } as any);

            expect(result).toBe('https://s3.example.com/download');
            expect(mockStorageService.getDownloadUrl).toHaveBeenCalledWith(
                'private',
                'videos/u_1/123.mp4',
                7200
            );
        });
    });

    // ── getPublicUrl ─────────────────────────────────────────────────────────

    describe('getPublicUrl', () => {
        it('should return public URL', async () => {
            mockFileRepo.findById.mockResolvedValue(
                makeFileRecord({ key: 'avatars/u_1/photo.png' })
            );
            mockStorageService.getPublicUrl.mockReturnValue(
                'https://cdn.example.com/public/avatars/u_1/photo.png'
            );

            const result = await service.getPublicUrl('file_1');

            expect(result).toBe('https://cdn.example.com/public/avatars/u_1/photo.png');
            expect(mockStorageService.getPublicUrl).toHaveBeenCalledWith('avatars/u_1/photo.png');
        });
    });

    // ── serverUpload ──────────────────────────────────────────────────────────

    describe('serverUpload', () => {
        it('should upload and return fileId', async () => {
            mockStorageService.putObject.mockResolvedValue(undefined);
            mockFileRepo.create.mockResolvedValue(makeFileRecord({ id: 'file_server' }));
            mockFileRepo.updateStatus.mockResolvedValue(makeFileRecord({ status: 'ACTIVE' }));

            const result = await service.serverUpload(
                'u_1',
                { domain: 'avatar', filename: 'photo.jpg' } as any,
                Buffer.from('data'),
                'image/jpeg'
            );

            expect(result).toEqual({ fileId: 'file_server' });
            expect(mockStorageService.putObject).toHaveBeenCalledWith(
                'public',
                expect.stringContaining('avatars/u_1/'),
                expect.any(Buffer),
                'image/jpeg'
            );
            expect(mockFileRepo.updateStatus).toHaveBeenCalledWith('file_server', 'ACTIVE');
        });
    });

    // ── proxyDownload ────────────────────────────────────────────────────────

    describe('proxyDownload', () => {
        it('should use Buffer when file size <= 5MB', async () => {
            const buf = Buffer.from('small content');
            mockFileRepo.findById.mockResolvedValue(makeFileRecord({ filename: 'photo.png' }));
            mockStorageService.getObjectSize.mockResolvedValue(1024 * 1024); // 1MB
            mockStorageService.getObject.mockResolvedValue(buf);

            const result = await service.proxyDownload('file_1');

            expect(result.isStream).toBe(false);
            expect(result.data).toBe(buf);
            expect(result.filename).toBe('photo.png');
            expect(mockStorageService.getObject).toHaveBeenCalled();
            expect(mockStorageService.getObjectStream).not.toHaveBeenCalled();
        });

        it('should use Stream when file size > 5MB', async () => {
            const stream = new Readable({ read() {} });
            mockFileRepo.findById.mockResolvedValue(makeFileRecord({ filename: 'clip.mp4' }));
            mockStorageService.getObjectSize.mockResolvedValue(10 * 1024 * 1024); // 10MB
            mockStorageService.getObjectStream.mockResolvedValue(stream);

            const result = await service.proxyDownload('file_1');

            expect(result.isStream).toBe(true);
            expect(result.data).toBe(stream);
            expect(result.filename).toBe('clip.mp4');
            expect(mockStorageService.getObjectStream).toHaveBeenCalled();
            expect(mockStorageService.getObject).not.toHaveBeenCalled();
        });

        it('should throw FileRecordNotFoundException for unknown fileId', async () => {
            mockFileRepo.findById.mockResolvedValue(null);

            await expect(service.proxyDownload('nonexistent')).rejects.toBeInstanceOf(
                FileRecordNotFoundException
            );
        });
    });

    // ── deleteFiles ──────────────────────────────────────────────────────────

    describe('deleteFiles', () => {
        it('should call deleteObject for single file', async () => {
            mockFileRepo.findById.mockResolvedValue(makeFileRecord());
            mockStorageService.deleteObject.mockResolvedValue(undefined);
            mockFileRepo.softDeleteMany.mockResolvedValue({ count: 1 });

            await service.deleteFiles({ fileIds: ['file_1'] } as any);

            expect(mockStorageService.deleteObject).toHaveBeenCalledWith(
                'public',
                'avatars/u_1/123.png'
            );
            expect(mockStorageService.deleteObjects).not.toHaveBeenCalled();
            expect(mockFileRepo.softDeleteMany).toHaveBeenCalledWith(['file_1']);
        });

        it('should call deleteObjects for multiple files in same bucket', async () => {
            mockFileRepo.findById
                .mockResolvedValueOnce(
                    makeFileRecord({ id: 'file_1', key: 'a.pdf', bucket: 'private' })
                )
                .mockResolvedValueOnce(
                    makeFileRecord({ id: 'file_2', key: 'b.pdf', bucket: 'private' })
                );
            mockStorageService.deleteObjects.mockResolvedValue(undefined);
            mockFileRepo.softDeleteMany.mockResolvedValue({ count: 2 });

            await service.deleteFiles({ fileIds: ['file_1', 'file_2'] } as any);

            expect(mockStorageService.deleteObjects).toHaveBeenCalledWith('private', [
                'a.pdf',
                'b.pdf',
            ]);
            expect(mockStorageService.deleteObject).not.toHaveBeenCalled();
        });

        it('should throw FileRecordNotFoundException for unknown fileId', async () => {
            mockFileRepo.findById.mockResolvedValue(null);

            await expect(
                service.deleteFiles({ fileIds: ['nonexistent'] } as any)
            ).rejects.toBeInstanceOf(FileRecordNotFoundException);
        });
    });

    // ── fileExists ───────────────────────────────────────────────────────────

    describe('fileExists', () => {
        it('should return true when object exists', async () => {
            mockFileRepo.findById.mockResolvedValue(makeFileRecord());
            mockStorageService.objectExists.mockResolvedValue(true);

            expect(await service.fileExists('file_1')).toBe(true);
        });

        it('should return false when object does not exist', async () => {
            mockFileRepo.findById.mockResolvedValue(makeFileRecord());
            mockStorageService.objectExists.mockResolvedValue(false);

            expect(await service.fileExists('file_1')).toBe(false);
        });
    });

    // ── copyFile ─────────────────────────────────────────────────────────────

    describe('copyFile', () => {
        it('should copy file and return new fileId', async () => {
            mockFileRepo.findById.mockResolvedValue(makeFileRecord());
            mockStorageService.copyObject.mockResolvedValue(undefined);
            mockFileRepo.create.mockResolvedValue(
                makeFileRecord({ id: 'file_copy', domain: 'avatar' })
            );
            mockFileRepo.updateStatus.mockResolvedValue(
                makeFileRecord({ id: 'file_copy', status: 'ACTIVE' })
            );

            const result = await service.copyFile('u_1', {
                fileId: 'file_1',
                destDomain: 'avatar',
            } as any);

            expect(result).toEqual({ fileId: 'file_copy' });
            expect(mockStorageService.copyObject).toHaveBeenCalled();
        });
    });

    // ── initMultipartUpload ──────────────────────────────────────────────────

    describe('initMultipartUpload', () => {
        it('should initialize multipart upload and return fileId', async () => {
            const storageResult = {
                uploadId: 'upload_1',
                partUrls: [{ partNumber: 1, url: 'https://s3.example.com/part1' }],
            };
            mockStorageService.initMultipartUpload.mockResolvedValue(storageResult);
            mockFileRepo.create.mockResolvedValue(
                makeFileRecord({ id: 'file_multi', uploadId: 'upload_1' })
            );

            const result = await service.initMultipartUpload('u_1', {
                domain: 'video',
                contentType: 'video/mp4',
                filename: 'movie.mp4',
                partCount: 1,
            } as any);

            expect(result.fileId).toBe('file_multi');
            expect(result.uploadId).toBe('upload_1');
            expect(result.partUrls).toBe(storageResult.partUrls);
            expect(mockFileRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ uploadId: 'upload_1' })
            );
        });

        it('should throw FileInvalidDomainException for invalid domain', async () => {
            await expect(
                service.initMultipartUpload('u_1', {
                    domain: 'invalid',
                    contentType: 'video/mp4',
                    filename: 'movie.mp4',
                    partCount: 2,
                } as any)
            ).rejects.toBeInstanceOf(FileInvalidDomainException);
        });
    });

    // ── resumeMultipartUpload ────────────────────────────────────────────────

    describe('resumeMultipartUpload', () => {
        it('should return resumable part URLs', async () => {
            mockFileRepo.findById.mockResolvedValue(
                makeFileRecord({
                    domain: 'video',
                    bucket: 'private',
                    key: 'videos/u_1/123.mp4',
                    uploadId: 'upload_1',
                })
            );
            const mockResult = {
                completedParts: [],
                partUrls: [{ partNumber: 1, url: 'https://s3.example.com/part1' }],
            };
            mockStorageService.getResumablePartUrls.mockResolvedValue(mockResult);

            const result = await service.resumeMultipartUpload({
                fileId: 'file_1',
                totalParts: 1,
                completedPartNumbers: [],
                expiresIn: 3600,
            } as any);

            expect(result).toBe(mockResult);
            expect(mockStorageService.getResumablePartUrls).toHaveBeenCalledWith(
                'private',
                'videos/u_1/123.mp4',
                'upload_1',
                1,
                [],
                3600
            );
        });
    });

    // ── completeMultipartUpload ──────────────────────────────────────────────

    describe('completeMultipartUpload', () => {
        it('should complete and activate file record', async () => {
            mockFileRepo.findById.mockResolvedValue(
                makeFileRecord({
                    bucket: 'private',
                    key: 'videos/u_1/123.mp4',
                    uploadId: 'upload_1',
                })
            );
            mockStorageService.completeMultipartUpload.mockResolvedValue(undefined);
            mockFileRepo.updateStatus.mockResolvedValue(makeFileRecord({ status: 'ACTIVE' }));

            await service.completeMultipartUpload({
                fileId: 'file_1',
                parts: [{ PartNumber: 1, ETag: '"etag1"' }],
            } as any);

            expect(mockStorageService.completeMultipartUpload).toHaveBeenCalledWith(
                'private',
                'videos/u_1/123.mp4',
                'upload_1',
                [{ PartNumber: 1, ETag: '"etag1"' }]
            );
            expect(mockFileRepo.updateStatus).toHaveBeenCalledWith('file_1', 'ACTIVE', null);
        });
    });

    // ── abortMultipartUpload ─────────────────────────────────────────────────

    describe('abortMultipartUpload', () => {
        it('should abort multipart upload and soft delete record', async () => {
            mockFileRepo.findById.mockResolvedValue(
                makeFileRecord({
                    bucket: 'private',
                    key: 'videos/u_1/123.mp4',
                    uploadId: 'upload_1',
                })
            );
            mockStorageService.abortMultipartUpload.mockResolvedValue(undefined);
            mockFileRepo.softDelete.mockResolvedValue(makeFileRecord({ status: 'DELETED' }));

            await service.abortMultipartUpload({ fileId: 'file_1' } as any);

            expect(mockStorageService.abortMultipartUpload).toHaveBeenCalledWith(
                'private',
                'videos/u_1/123.mp4',
                'upload_1'
            );
            expect(mockFileRepo.softDelete).toHaveBeenCalledWith('file_1');
        });
    });
});
