import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModule } from 'src/user/user.module';
import { UserQuery } from 'src/user/user.queries';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthQuery } from './auth.queries';
import { JwtStrategy } from './jwt.strategy';
import { COMMON } from 'src/entitys/common/common.model';
import { CommonQuery } from 'src/common/common.queries';

@Module({
  imports: [
    SequelizeModule.forFeature([COMMON]),
    JwtModule.register({
      secret: `${process.env.JWT_TOKEN_SECRET}`,
      signOptions: { expiresIn: '1h' },
    }),
    UserModule,
  ],
  providers: [
    AuthService,
    AuthQuery,
    UserQuery,
    JwtStrategy,
    CommonQuery,
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule { }
