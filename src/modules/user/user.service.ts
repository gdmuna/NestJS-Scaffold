import { UpdateUserProfileDto } from './user.dto.js';
import { UserAvatarFileNotFoundException } from './user.exception.js';
import { FileRepository } from '../file/file.repository.js';
import { UserRepository } from './user.repository.js';

import { Logger } from '@/common/services/logger.service.js';

import { DatabaseService } from '@/infra/index.js';

import { Injectable } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        private readonly cacheManager: Cache,
        private readonly configService: ConfigService,
        private readonly db: DatabaseService,
        private readonly fileRepo: FileRepository,
        private readonly userRepo: UserRepository
    ) {}

    getUserProfile(userId: string) {
        this.logger.debug(`Fetching profile for user ${userId}`);
        return this.userRepo.getUserById(userId);
    }

    async updateUserProfile(userId: string, dto: UpdateUserProfileDto) {
        this.logger.debug(`Updating profile for user ${userId} with data: ${JSON.stringify(dto)}`);
        if (!dto.avatarId) return this.userRepo.updateUserProfile(userId, dto);
        const avatarId = dto.avatarId;
        return this.db.$transaction(async (tx) => {
            const record = await this.fileRepo.findById(avatarId, tx);
            if (!record || record.status === 'DELETED') {
                this.logger.warn(`Invalid avatarId ${avatarId} for user ${userId}`);
                throw new UserAvatarFileNotFoundException();
            }
            if (record.status === 'PENDING') {
                await this.fileRepo.updateStatus(avatarId, 'ACTIVE', undefined, tx);
            }
            return this.userRepo.updateUserProfile(userId, dto, tx);
        });
    }
}
