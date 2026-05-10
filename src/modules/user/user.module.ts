import { MeController, UserController } from './user.controller.js';
import { FileModule } from '../file/file.module.js';
import { UserRepository } from './user.repository.js';
import { UserService } from './user.service.js';

import { Module } from '@nestjs/common';

@Module({
    imports: [FileModule],
    controllers: [MeController, UserController],
    providers: [UserRepository, UserService],
})
export class UserModule {}
