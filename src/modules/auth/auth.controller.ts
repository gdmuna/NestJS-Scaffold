import { AccessTokenDto, AuthResponseDto, LoginDto, RegisterDto } from './auth.dto.js';
import AUTH_EXCEPTION from './auth.exception.js';
import { AuthService } from './services/auth.service.js';

import { Public } from '@/common/decorators/index.js';
import { extractRefreshTokenFromRequest } from '@/common/utils/index.js';

import { REFRESH_TOKEN_COOKIE } from '@/constants/auth.constant.js';

import { AlsService } from '@/infra/index.js';

import { Controller, Post, Body, Req, Res, Get } from '@nestjs/common';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly alsService: AlsService
    ) {}

    @Post('register')
    @Public()
    async register(@Body() body: RegisterDto, @Res({ passthrough: true }) response: Response) {
        const authResult = await this.authService.register(body);

        response.cookie(REFRESH_TOKEN_COOKIE.NAME, authResult.refreshToken, {
            httpOnly: REFRESH_TOKEN_COOKIE.HTTP_ONLY,
            sameSite: REFRESH_TOKEN_COOKIE.SAME_SITE,
            secure: REFRESH_TOKEN_COOKIE.SECURE,
            path: REFRESH_TOKEN_COOKIE.PATH,
            maxAge: REFRESH_TOKEN_COOKIE.MAX_AGE_MS,
        });

        return {
            accessToken: authResult.accessToken,
            user: authResult.user,
        } satisfies AuthResponseDto;
    }

    @Post('login')
    @Public()
    async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
        const authResult = await this.authService.login(body);

        response.cookie(REFRESH_TOKEN_COOKIE.NAME, authResult.refreshToken, {
            httpOnly: REFRESH_TOKEN_COOKIE.HTTP_ONLY,
            sameSite: REFRESH_TOKEN_COOKIE.SAME_SITE,
            secure: REFRESH_TOKEN_COOKIE.SECURE,
            path: REFRESH_TOKEN_COOKIE.PATH,
            maxAge: REFRESH_TOKEN_COOKIE.MAX_AGE_MS,
        });

        return {
            accessToken: authResult.accessToken,
            user: authResult.user,
        } satisfies AuthResponseDto;
    }

    @Post('refresh-token')
    @Public()
    async refreshToken(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response
    ): Promise<AccessTokenDto> {
        const refreshToken = extractRefreshTokenFromRequest(request);
        if (!refreshToken) {
            throw new AUTH_EXCEPTION.MissingTokenException({
                message: 'Refresh token is required',
            });
        }

        const tokenPair = await this.authService.rotateRefreshToken(refreshToken);
        response.cookie(REFRESH_TOKEN_COOKIE.NAME, tokenPair.refreshToken, {
            httpOnly: REFRESH_TOKEN_COOKIE.HTTP_ONLY,
            sameSite: REFRESH_TOKEN_COOKIE.SAME_SITE,
            secure: REFRESH_TOKEN_COOKIE.SECURE,
            path: REFRESH_TOKEN_COOKIE.PATH,
            maxAge: REFRESH_TOKEN_COOKIE.MAX_AGE_MS,
        });

        return {
            accessToken: tokenPair.accessToken,
        };
    }

    @Get('clear-cookie')
    @Public()
    async logout(@Res({ passthrough: true }) response: Response) {
        response.clearCookie(REFRESH_TOKEN_COOKIE.NAME, {
            path: REFRESH_TOKEN_COOKIE.PATH,
        });
        return 'clear cookie successful';
    }
}
