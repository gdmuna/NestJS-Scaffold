import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthService {
    extractToken(payload: string) {
        const match = payload.match(/^Bearer[ ](.+)$/);
        return match ? match[1] : null;
    }

    extractTokenFromRequest(request: Request) {
        const authHeader: string | undefined = request.headers?.['authorization'];
        const authCookie: string | undefined = request.cookies?.['authorization'];
        const tokenFromHeader = authHeader ? this.extractToken(authHeader) : null;
        const tokenFromCookie = authCookie ? this.extractToken(authCookie) : null;
        const token = tokenFromHeader || tokenFromCookie;
        return token;
    }

    validateToken(token: string) {
        // 这里应该调用 JWT 库来验证和解析 token，这里只是一个示例
        if (token === 'valid-token') {
            return { id: '1', username: 'testuser' }; // 模拟的用户信息
        }
        return null;
    }
}
