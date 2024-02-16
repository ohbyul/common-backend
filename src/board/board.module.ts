import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { BoardQuery } from './board.queries';
import { COMMON } from 'src/entitys/common/common.model';

@Module({
  imports: [SequelizeModule.forFeature([COMMON])],
  controllers: [BoardController],
  providers: [
    BoardService,
    BoardQuery,
  ],
})
export class BoardModule { }
