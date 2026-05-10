import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';
import { UserProfileSex } from '@root/prisma/generated/enums.js';
import { v7 as uuidv7 } from 'uuid';

export const UpdateUserProfileDtoSchema = z
    .object({
        nickname: z.string().min(2).max(30).nullish().meta({ title: '昵称', example: '技术宅' }),
        avatarId: z
            .uuid({ version: 'v7' })
            .nullish()
            .meta({ title: '头像文件 ID', example: uuidv7() }),
        bio: z.string().max(200).nullish().meta({ title: '个人简介', example: '热爱技术的开发者' }),
        sex: z.enum(UserProfileSex).nullish().meta({ title: '性别', example: 'MALE' }),
        sexVisible: z.boolean().optional().meta({ title: '性别公开', example: true }),
        birthday: z.iso
            .date()
            .nullish()
            .transform((str) => {
                if (!str) return str;
                return new Date(str);
            })
            .meta({ title: '生日', example: '2005-11-10' }),
    })
    .meta({ description: '更新用户档案的请求 Dto' });

export class UpdateUserProfileDto extends createZodDto(UpdateUserProfileDtoSchema) {}

export const UpdateUserProfileResSchema = z.object({});
