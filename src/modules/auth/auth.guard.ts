import { TokenService } from './services/index.js';

import { IS_PUBLIC_KEY } from '@/common/decorators/index.js';
import { BusinessException } from '@/common/exceptions/index.js';
import { extractAccessTokenFromRequest } from '@/common/utils/index.js';

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly tokenService: TokenService
    ) {}

    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<Request>();

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const accessToken = extractAccessTokenFromRequest(request);

        if (isPublic) {
            if (!accessToken) return true;

            const claim = this.tokenService.verifyToken(accessToken, 'access');
            if (claim) {
                request.jwtClaim = claim;
            }

            return true;
        }

        if (!accessToken) {
            throw new BusinessException(
                'Missing access token',
                'AUTH_FAILED',
                HttpStatus.UNAUTHORIZED
            );
        }

        const claim = this.tokenService.verifyToken(accessToken, 'access');
        if (!claim) {
            throw new BusinessException(
                'Invalid access token',
                'AUTH_FAILED',
                HttpStatus.UNAUTHORIZED
            );
        }

        request.jwtClaim = claim;
        return true;
    }
}
