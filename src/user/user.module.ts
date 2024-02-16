import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';;
import { UserController } from './user.controller';;
import { UserQuery } from './user.queries';
import { UserService } from './user.service';
import { AuthQuery } from 'src/auth/auth.queries';
import { COMMON } from 'src/entitys/common/common.model';
import { CommonQuery } from 'src/common/common.queries';
@Module({
  imports: [
    SequelizeModule.forFeature([COMMON])
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserQuery,
    AuthQuery,
    CommonQuery,
  ],
  exports: [UserService],
})
export class UserModule { }
