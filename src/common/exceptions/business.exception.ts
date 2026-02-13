import { HttpException } from '@nestjs/common';

/**
 * @description: 业务异常类
 * @example: throw new BusinessException('用户不存在', 'USER_NOT_FOUND', 404);
 */
export class BusinessException extends HttpException {
    constructor(
        public readonly message: string,
        private readonly code: string,
        status: number,
        private readonly details?: any
    ) {
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
