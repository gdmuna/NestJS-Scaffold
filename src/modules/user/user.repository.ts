import { UpdateUserProfileDto } from './user.dto.js';

import { DatabaseService } from '@/infra/index.js';

import type { Prisma } from '@root/prisma/generated/client.js';

import { Injectable } from '@nestjs/common';

type Tx = Prisma.TransactionClient;

@Injectable()
export class UserRepository {
    constructor(private readonly databaseService: DatabaseService) {}

    getUserById(id: string, tx?: Tx) {
        return (tx ?? this.databaseService).user.findUnique({
            where: { id },
            include: {
                profile: {
                    include: {
                        avatar: true,
                    },
                },
            },
            omit: {
                passwordHash: true,
            },
        });
    }

    // getUserByUsername(username: string, tx?: Tx) {
    //     return (tx ?? this.databaseService).user.findUnique({
    //         where: { username },
    //         include: {
    //             profile: true,
    //         },
    //         omit: {
    //             passwordHash: true,
    //         }
    //     });
    // }

    updateUserProfile(userId: string, dto: UpdateUserProfileDto, tx?: Tx) {
        return (tx ?? this.databaseService).userProfile.update({
            where: { userId },
            data: dto,
        });
    }
}
