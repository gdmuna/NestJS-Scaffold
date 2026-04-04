import { AccessTokenDto, AuthResponseDto, LoginDto, RegisterDto } from './auth.dto.js';
import AUTH_EXCEPTION from './auth.exception.js';
import { AuthService } from './services/auth.service.js';

import { ApiRoute } from '@/common/decorators/index.js';
import { extractRefreshTokenFromRequest } from '@/common/utils/index.js';

import { REFRESH_TOKEN_COOKIE } from '@/constants/auth.constant.js';

import { AlsService } from '@/infra/index.js';

import { Controller, Post, Body, Req, Res, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

@ApiTags('认证模块')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly alsService: AlsService
    ) {}

    @Post('register')
    @ApiRoute({
        auth: 'public',
        summary: '用户注册',
        description: '创建一个新用户账户，并返回访问令牌和用户信息。',
        errors: [AUTH_EXCEPTION.DuplicateUserException.code],
    })
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
    @ApiRoute({
        auth: 'public',
        summary: '用户登录',
        description: '验证用户凭据，成功后返回访问令牌和用户信息。',
        errors: [AUTH_EXCEPTION.InvalidCredentialsException.code],
    })
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
    @ApiRoute({
        auth: 'public',
        summary: '刷新访问令牌',
        description: '使用有效的刷新令牌获取新的访问令牌。',
    })
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
    @ApiRoute({
        auth: 'optional',
        summary: '清除刷新令牌 Cookie',
        description: '清除浏览器中的刷新令牌 Cookie，通常用于用户登出。',
    })
    async logout(@Res({ passthrough: true }) response: Response) {
        response.clearCookie(REFRESH_TOKEN_COOKIE.NAME, {
            path: REFRESH_TOKEN_COOKIE.PATH,
        });
        return 'clear cookie successful';
    }
}
