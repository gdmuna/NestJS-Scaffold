import { AuthService } from './auth.service.js';

import { IS_PUBLIC_KEY } from '@/common/decorators/index.js';

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private authService: AuthService
    ) {}

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ])
            ? true
            : false;
        if (isPublic) {
            return true;
        }
        return true;
    }
}
