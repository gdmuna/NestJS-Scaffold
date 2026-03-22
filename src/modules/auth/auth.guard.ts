import { AuthService } from './auth.service.js';

import { IS_PUBLIC_KEY } from '@/common/decorators/index.js';

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private authService: AuthService
    ) {}

    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<Request>();

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            const token = this.authService.extractTokenFromRequest(request);
            if (!token) return true;

            const claim = this.authService.validateToken(token);
            if (claim) {
                request.user = claim;
            }

            return true;
        }

        const authHeader = request.headers['authorization'];
        if (!authHeader) {
            return false;
        }

        const token = this.authService.extractToken(authHeader);
        if (!token) {
            return false;
        }

        const claim = this.authService.validateToken(token);
        if (!claim) {
            return false;
        }

        request.user = claim;
        return true;
    }
}
