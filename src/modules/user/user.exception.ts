import { RegisterException } from '@/common/exceptions/exception-registry.js';
import { AuthException, ResourceException } from '@/common/exceptions/index.js';

export const UserExceptionCode = {
    AVATAR_FILE_NOT_FOUND: 'USER_AVATAR_FILE_NOT_FOUND',
} as const;

@RegisterException({
    code: UserExceptionCode.AVATAR_FILE_NOT_FOUND,
    statusCode: 404,
    message: '用户头像文件不存在',
    description: '请求的用户头像文件在存储中未找到，可能已被删除或从未上传',
    retryable: false,
    logLevel: 'info',
    causes: ['用户未上传过头像', '头像文件已被删除'],
    hint: '确认用户是否已上传头像，检查存储服务中对应的文件是否存在',
})
export class UserAvatarFileNotFoundException extends ResourceException {}
