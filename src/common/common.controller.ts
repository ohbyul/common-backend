import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Options,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { TransactionParam } from 'src/decorator/transaction.deco';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

import { Transaction } from 'sequelize';
import { CommonService } from './common.service';
import { CommonPageDto } from 'src/dto/sample/common-page.dto';
import { SMSSendDto } from 'src/dto/common/sms-send.dto';
import { EmailSendDto } from 'src/dto/common/email-send.dto';
import { CloudApi } from 'src/lib/cloud-api';
import { FilesInterceptor } from '@nestjs/platform-express';


@ApiTags('COMMON API')
@Controller('api/common')
export class CommonController {
  constructor(
    private commonService: CommonService,
    private cloudApi: CloudApi,
  ) { }


  /*************************************************
   * 사용자 권한 코드 리스트 조회
   * 
   * @returns 사용자 권한 리스트
   ************************************************/
  @Get('code-list')
  @ApiOperation({
    summary: '코드 리스트',
    description: '그룹코드로 코드 리스트 조회',
  })
  @ApiQuery({ name: 'groupCd' })
  async getCodeList(@Query() props,
    @TransactionParam() transaction: Transaction) {
    return this.commonService.getCommonCodeList({ props, transaction });
  }


  /*************************************************
   * SMS 발송
   * 
   * @returns 성공실패
   ************************************************/
  @Post('sms')
  @ApiOperation({
    summary: 'SMS 발송',
    description: 'NCP의 문자 서비스 호출',
  })
  @ApiBody({ type: SMSSendDto })
  async sendSMS(@Body() props: SMSSendDto, @TransactionParam() transaction: Transaction) {
    return this.commonService.sendSMS({ props, transaction });
  }

  /*************************************************
  * EMAIL 발송
  * 
  * @returns 성공실패
  ************************************************/
  @Post('email')
  @ApiOperation({
    summary: 'EMAIL 발송',
    description: 'NCP의 EMAIL 서비스 호출',
  })
  @ApiBody({ type: EmailSendDto })
  async sendEmail(@Body() props: EmailSendDto, @TransactionParam() transaction: Transaction) {
    return this.commonService.sendEmail({ props, transaction });
  }

  /*************************************************
   * 에디터 이미지 s3업로드 , 이미지 url 가져오기
   * 
   * @param 
   * @returns 이미지 url
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('/editor/image')
  @ApiOperation({
    summary: '게시글 등록',
    description: '게시글 등록 ',
  })
  @UseInterceptors(FilesInterceptor('file'))  // acl : 'public-read'
  async uploadEditorImage(@Body() props
    , @Req() req
    , @TransactionParam() transaction: Transaction
    , @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    props['files'] = files
    return this.commonService.uploadEditorImage({ props, transaction })
  }

  /*************************************************
  * S3 파일 가져오기
  * 
  * @returns fileStream
  ************************************************/
  @Get('s3')
  @ApiOperation({
    summary: 'S3 파일 가져오기',
    description: 'S3 파일 가져오기',
  })
  @ApiQuery({ name: 'path' })
  @ApiQuery({ name: 'fileName' })
  async getS3Data(@Query() props, @TransactionParam() transaction: Transaction) {
    return this.cloudApi.getS3Data({ props, transaction });
  }

  /*************************************************
   * S3 파일 다운로드 -ALL
   * 
   * @param
   * @returns fileStream
   ************************************************/
  // @Post('/s3/download-all/:id')
  // @ApiOperation({
  //   summary: 'S3 파일 가져오기 다운로드 -ALL',
  //   description: 'S3 파일 가져오기 다운로드 -ALL',
  // })
  // async postDownloadAllFile(@Param('id') id: any
  //   , @Req() req
  //   , @TransactionParam() transaction: Transaction) {
  //   let props: any = req.body;
  //   props['encryptoId'] = id

  //   return this.commonService.downloadFileAll({ props, transaction });
  // }



}
