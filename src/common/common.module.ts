import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { CommonQuery } from './common.queries';
import { COMMON } from 'src/entitys/common/common.model';
import { SMSSender } from 'src/lib/sms-sender';
import { ReqRes } from 'src/lib/req-res';
import { Crypto } from 'src/lib/crypto';
import { EmailSender } from 'src/lib/email-sender';
import { CloudApi } from 'src/lib/cloud-api';
import { PublicApi } from 'src/lib/public-api';
import { BoardQuery } from 'src/board/board.queries';
import { BoardService } from 'src/board/board.service';
@Global()
@Module({
  imports: [SequelizeModule.forFeature([COMMON])],
  controllers: [CommonController],
  providers: [
    CommonService,
    CommonQuery,

    BoardQuery,
    BoardService,

    SMSSender,
    EmailSender,
    ReqRes,
    Crypto,
    CloudApi,
    PublicApi,
  ],
  exports: [
    Crypto,
    CloudApi,
    EmailSender,
    SMSSender,
    ReqRes,
    PublicApi,
  ],
})
export class CommonModule { }
