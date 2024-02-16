import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { SequelizeTransactionalModule, initSequelizeCLS } from 'sequelize-transactional-decorator';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BoardModule } from './board/board.module';

import { USER } from './entitys/auth/user.entity';

import { COMMON } from './entitys/common/common.model';
import { CommonModule } from './common/common.module';
import { AllExceptionsFilter } from './filter/all.exceptions.filter';

initSequelizeCLS();

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.code'],
    }),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      timezone: "+09:00",
      synchronize: true,
      pool: {
        acquire: 10000,
        idle: 1000,
        max: 10,
        min: 5
      },
      logging: process.env.DATABASE_LOGGING == null ? false : process.env.DATABASE_LOGGING === 'true',
      benchmark: true,  /* 쿼리수행 시간 */
      models: [COMMON],
    }),
    SequelizeTransactionalModule.register(),
    AuthModule,
    UserModule,
    BoardModule,
    CommonModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [
    CommonModule
  ]
})
export class AppModule { }
