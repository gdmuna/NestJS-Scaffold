import { FileController } from '@/modules/file/file.controller.js';
import { FileService } from '@/modules/file/file.service.js';
import { NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';

// ─── Mock FileService ─────────────────────────────────────────────────────────

const mockFileService: jest.Mocked<
    Pick<
        FileService,
        | 'getPresignedUploadUrl'
        | 'getPresignedDownloadUrl'
        | 'getPublicUrl'
        | 'confirmUpload'
        | 'serverUpload'
        | 'proxyDownload'
        | 'fileExists'
        | 'deleteFiles'
        | 'copyFile'
        | 'initMultipartUpload'
        | 'resumeMultipartUpload'
        | 'completeMultipartUpload'
        | 'abortMultipartUpload'
    >
> = {
    getPresignedUploadUrl: jest.fn(),
    getPresignedDownloadUrl: jest.fn(),
    getPublicUrl: jest.fn(),
    confirmUpload: jest.fn(),
    serverUpload: jest.fn(),
    proxyDownload: jest.fn(),
    fileExists: jest.fn(),
    deleteFiles: jest.fn(),
    copyFile: jest.fn(),
    initMultipartUpload: jest.fn(),
    resumeMultipartUpload: jest.fn(),
    completeMultipartUpload: jest.fn(),
    abortMultipartUpload: jest.fn(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildController() {
    return new FileController(mockFileService as unknown as FileService);
}

const mockRequest: any = { jwtClaim: { sub: 'u_1' } };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FileController (unit)', () => {
    let controller: FileController;

    beforeEach(() => {
        jest.clearAllMocks();
        controller = buildController();
    });

    // ── presignUpload ─────────────────────────────────────────────────────────

    describe('presignUpload', () => {
        it('should return fileId and uploadUrl', async () => {
            const mockResult = { fileId: 'file_1', uploadUrl: 'https://s3.example.com/presign' };
            mockFileService.getPresignedUploadUrl.mockResolvedValue(mockResult);

            const result = await controller.presignUpload(
                { domain: 'avatar', contentType: 'image/png', filename: 'photo.png' } as any,
                mockRequest
            );

            expect(result).toBe(mockResult);
            expect(mockFileService.getPresignedUploadUrl).toHaveBeenCalledWith(
                'u_1',
                expect.objectContaining({ domain: 'avatar' })
            );
        });
    });

    // ── presignDownload ───────────────────────────────────────────────────────

    describe('presignDownload', () => {
        it('should return download presigned URL', async () => {
            mockFileService.getPresignedDownloadUrl.mockResolvedValue(
                'https://s3.example.com/download'
            );

            const result = await controller.presignDownload({
                fileId: 'file_1',
                expiresIn: 3600,
            } as any);

            expect(result).toBe('https://s3.example.com/download');
            expect(mockFileService.getPresignedDownloadUrl).toHaveBeenCalledWith(
                expect.objectContaining({ fileId: 'file_1' })
            );
        });
    });

    // ── publicUrl ────────────────────────────────────────────────────────────

    describe('publicUrl', () => {
        it('should return public URL for given fileId', async () => {
            mockFileService.getPublicUrl.mockResolvedValue(
                'https://cdn.example.com/public/avatars/u_1/photo.jpg'
            );

            const result = await controller.publicUrl('file_1');

            expect(result).toBe('https://cdn.example.com/public/avatars/u_1/photo.jpg');
            expect(mockFileService.getPublicUrl).toHaveBeenCalledWith('file_1');
        });
    });

    // ── confirmUpload ─────────────────────────────────────────────────────────

    describe('confirmUpload', () => {
        it('should confirm upload and return file record', async () => {
            const mockRecord = { id: 'file_1', status: 'ACTIVE' } as any;
            mockFileService.confirmUpload.mockResolvedValue(mockRecord);

            const result = await controller.confirmUpload('file_1');

            expect(result).toBe(mockRecord);
            expect(mockFileService.confirmUpload).toHaveBeenCalledWith(
                expect.objectContaining({ fileId: 'file_1' })
            );
        });
    });

    // ── serverUpload ──────────────────────────────────────────────────────────

    describe('serverUpload', () => {
        it('should call serverUpload with file buffer and mimetype', async () => {
            const mockResult = { fileId: 'file_server' };
            mockFileService.serverUpload.mockResolvedValue(mockResult);
            const file = {
                buffer: Buffer.from('data'),
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            const result = await controller.serverUpload(
                file,
                { domain: 'avatar', filename: 'photo.jpg' } as any,
                mockRequest
            );

            expect(result).toBe(mockResult);
            expect(mockFileService.serverUpload).toHaveBeenCalledWith(
                'u_1',
                expect.objectContaining({ domain: 'avatar' }),
                file.buffer,
                'image/jpeg'
            );
        });
    });

    // ── proxyDownload ─────────────────────────────────────────────────────────

    describe('proxyDownload', () => {
        it('should return StreamableFile (Buffer path for small file)', async () => {
            const buf = Buffer.from('file content');
            mockFileService.proxyDownload.mockResolvedValue({
                data: buf,
                filename: 'photo.jpg',
                isStream: false,
            });
            const mockRes: any = { setHeader: jest.fn() };

            const result = await controller.proxyDownload('file_1', mockRes);

            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Content-Type',
                'application/octet-stream'
            );
            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Content-Disposition',
                'attachment; filename="photo.jpg"'
            );
            expect(result).toBeDefined();
        });

        it('should return StreamableFile (Stream path for large file)', async () => {
            const stream = new Readable({ read() {} });
            mockFileService.proxyDownload.mockResolvedValue({
                data: stream,
                filename: 'video.mp4',
                isStream: true,
            });
            const mockRes: any = { setHeader: jest.fn() };

            const result = await controller.proxyDownload('file_1', mockRes);

            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Content-Disposition',
                'attachment; filename="video.mp4"'
            );
            expect(result).toBeDefined();
        });
    });

    // ── fileExists ────────────────────────────────────────────────────────────
    // Endpoint commented out in controller
    // describe.skip('fileExists', () => {
    //     it('should complete without error when file exists', async () => {
    //         mockFileService.fileExists.mockResolvedValue(true);

    //         await expect(controller.fileExists('file_1')).resolves.toBeUndefined();
    //     });

    //     it('should throw NotFoundException when file does not exist', async () => {
    //         mockFileService.fileExists.mockResolvedValue(false);

    //         await expect(controller.fileExists('file_1')).rejects.toBeInstanceOf(NotFoundException);
    //     });
    // });

    // ── deleteFiles ───────────────────────────────────────────────────────────

    describe('deleteFiles', () => {
        it('should call fileService.deleteFiles', async () => {
            mockFileService.deleteFiles.mockResolvedValue(undefined);

            await controller.deleteFiles({ fileIds: ['file_1', 'file_2'] } as any);

            expect(mockFileService.deleteFiles).toHaveBeenCalledWith(
                expect.objectContaining({ fileIds: ['file_1', 'file_2'] })
            );
        });
    });

    // ── copyFile ──────────────────────────────────────────────────────────────
    // Endpoint commented out in controller
    // describe.skip('copyFile', () => {
    //     it('should call fileService.copyFile and return new fileId', async () => {
    //         const mockResult = { fileId: 'file_copy' };
    //         mockFileService.copyFile.mockResolvedValue(mockResult);

    //         const result = await controller.copyFile(
    //             { fileId: 'file_1', destDomain: 'avatar' } as any,
    //             mockRequest
    //         );

    //         expect(result).toBe(mockResult);
    //         expect(mockFileService.copyFile).toHaveBeenCalledWith(
    //             'u_1',
    //             expect.objectContaining({ fileId: 'file_1' })
    //         );
    //     });
    // });

    // ── initMultipart ─────────────────────────────────────────────────────────

    describe('initMultipart', () => {
        it('should return multipart init result', async () => {
            const mockResult = { fileId: 'file_multi', uploadId: 'upload_1', partUrls: [] };
            mockFileService.initMultipartUpload.mockResolvedValue(mockResult);

            const result = await controller.initMultipart(
                {
                    domain: 'video',
                    contentType: 'video/mp4',
                    filename: 'movie.mp4',
                    partCount: 3,
                } as any,
                mockRequest
            );

            expect(result).toBe(mockResult);
            expect(mockFileService.initMultipartUpload).toHaveBeenCalledWith(
                'u_1',
                expect.objectContaining({ domain: 'video' })
            );
        });
    });

    // ── resumeMultipart ───────────────────────────────────────────────────────
    // Endpoint commented out in controller
    // describe.skip('resumeMultipart', () => {
    //     it('should return resumable part URLs', async () => {
    //         const mockResult = {
    //             completedParts: [],
    //             partUrls: [{ partNumber: 1, url: 'https://s3.example.com/part1' }],
    //         };
    //         mockFileService.resumeMultipartUpload.mockResolvedValue(mockResult);

    //         const result = await controller.resumeMultipart({
    //             fileId: 'file_1',
    //             totalParts: 3,
    //             completedPartNumbers: [2, 3],
    //             expiresIn: 3600,
    //         } as any);

    //         expect(result).toBe(mockResult);
    //         expect(mockFileService.resumeMultipartUpload).toHaveBeenCalledWith(
    //             expect.objectContaining({ fileId: 'file_1' })
    //         );
    //     });
    // });

    // ── completeMultipart ─────────────────────────────────────────────────────

    describe('completeMultipart', () => {
        it('should complete multipart upload', async () => {
            mockFileService.completeMultipartUpload.mockResolvedValue(undefined);

            await controller.completeMultipart({
                fileId: 'file_1',
                parts: [{ PartNumber: 1, ETag: '"etag1"' }],
            } as any);

            expect(mockFileService.completeMultipartUpload).toHaveBeenCalledWith(
                expect.objectContaining({ fileId: 'file_1' })
            );
        });
    });

    // ── abortMultipart ────────────────────────────────────────────────────────

    describe('abortMultipart', () => {
        it('should abort multipart upload', async () => {
            mockFileService.abortMultipartUpload.mockResolvedValue(undefined);

            await controller.abortMultipart({ fileId: 'file_1' } as any);

            expect(mockFileService.abortMultipartUpload).toHaveBeenCalledWith(
                expect.objectContaining({ fileId: 'file_1' })
            );
        });
    });
});
