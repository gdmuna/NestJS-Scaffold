import { HttpException } from '@nestjs/common';

/**
 * @description: 业务异常类
 * @example: throw new BusinessException('用户不存在', 'USER_NOT_FOUND', 404);
 */
export class BusinessException extends HttpException {
    constructor(message: string, code: string, status: number, details?: any) {
        super(
            {
                message,
                code,
                details,
                timestamp: new Date().toISOString(),
            },
            status
        );
    }
}
