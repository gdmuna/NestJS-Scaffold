import { AuthGuard } from './auth.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
    controllers: [AuthController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        AuthService,
    ],
})
export class AuthModule {}
