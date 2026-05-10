import { UpdateUserProfileDto } from './user.dto.js';
import { UserService } from './user.service.js';

import { ApiRoute } from '@/common/decorators/index.js';

import { Controller, Get, Patch, Body, Param, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

@Controller('users/me')
@ApiTags('用户模块')
export class MeController {
    constructor(private readonly userService: UserService) {}

    @Get('profile')
    @ApiRoute({
        auth: 'required',
        summary: '获取当前用户信息',
        description: '返回当前已认证用户的基本信息和账户详情。',
    })
    getUserProfile(@Req() req: Request) {
        return this.userService.getUserProfile(req.jwtClaim!.sub);
    }

    @Patch('profile')
    @ApiRoute({
        auth: 'required',
        summary: '更新当前用户信息',
        description: '允许用户更新自己的基本信息，如昵称、头像等。',
    })
    updateUserProfile(@Req() req: Request, @Body() body: UpdateUserProfileDto) {
        return this.userService.updateUserProfile(req.jwtClaim!.sub, body);
    }
}

@Controller('users/:id')
@ApiTags('用户模块')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('profile')
    @ApiRoute({
        auth: 'public',
        roles: ['ADMIN'],
        summary: '获取用户公开信息',
        description: '根据用户 ID 获取该用户的公开信息，如昵称、头像等，不包含敏感数据。',
        deprecated: true,
    })
    getUserProfile(@Param('id') userId: string) {
        return this.userService.getUserProfile(userId);
    }

    @Patch('profile')
    @ApiRoute({
        auth: 'required',
        roles: ['ADMIN'],
        summary: '更新用户信息',
        description: '允许用户更新自己的基本信息，如昵称、头像等。',
        deprecated: true,
    })
    updateUserProfile(@Param('id') userId: string, @Body() body: UpdateUserProfileDto) {
        return this.userService.updateUserProfile(userId, body);
    }
}
