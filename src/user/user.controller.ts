import {
  Controller,
  Get, Post, Put,
  Request, Req, Body,
  Query, UseGuards, Param, UseInterceptors, UploadedFiles, StreamableFile, Delete
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TransactionParam } from 'src/decorator/transaction.deco';
import { Transaction } from 'sequelize';

import { CommonPageDto } from 'src/dto/sample/common-page.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SignUpDto } from 'src/dto/auth/sign-up';

@ApiTags('USER API')
@Controller('api/user')
export class UserController {
  constructor(
    private userService: UserService,
  ) { }
  /*************************************************
   * 이메일 검사 
   * 
   * @param email
   * @returns 이메일 검사 
   ************************************************/
  @Post('email-check')
  @ApiOperation({
    summary: '이메일 검사 API',
    description: '회원가입시 프로젝트에 등록된 메일 여부 검사',
  })
  async checkValidEmail(
    @TransactionParam() transaction: Transaction,
    @Body() props,
  ) {
    return this.userService.checkValidEmail({ props, transaction });
  }

  /*************************************************
   * 인증코드 발송 
   * 
   * @param AuthCodeDto
   * @returns 인증코드 발송 여부
   ************************************************/
  @Post('auth-code')
  @ApiOperation({
    summary: '인증코드 발송 API',
    description: '관리 포탈 사용자 인증코드 발송',
  })
  async insertAuthCode(
    @TransactionParam() transaction: Transaction,
    @Body() props,
  ) {
    return this.userService.insertAuthCode({ props, transaction });
  }

  /*************************************************
   * 인증코드 확인 
   * 
   * @param AuthCodeDto
   * @returns 인증코드 발송 여부
   ************************************************/
  @Get('auth-code')
  @ApiOperation({
    summary: '인증코드 확인 API',
    description: '관리 포탈 사용자 인증코드 확인',
  })
  async getAuthCode(@Query() props
    , @TransactionParam() transaction: Transaction
  ) {
    return this.userService.getAuthCode({ transaction, props });
  }

  /*************************************************
   * 가입신청   
   * 
   * @param SignUpDto
   * @returns 사용자 아이디 생성 성공여부
   ************************************************/
  @Post('sign-up')
  @ApiOperation({
    summary: '사용자 신청 API',
    description: '관리 포탈 사용자 신청',
  })
  @ApiBody({ type: SignUpDto })
  async insertUser(@Body() props,
    @TransactionParam() transaction: Transaction,
  ) {
    return this.userService.insertUser({ transaction, props });
  }

  /*************************************************
   * 사용자 아이디 중복확인     
   * 
   * @param {String} userId  사용자 아이디
   * @returns 사용자 아이디 중복여부
   ************************************************/
  @Get('duplication/:userId')
  @ApiOperation({
    summary: '사용자 아이디 중복확인',
    description: '사용자 아이디 중복확인',
  })
  @ApiParam({ name: 'userId' })
  async getDuplicationCheck(@Query() props
    , @Param('userId') path: any
    , @TransactionParam() transaction: Transaction) {
    props['userId'] = path;
    return this.userService.getDuplicationCheck({ transaction, props });
  }

  /*************************************************
   * 비밀번호 3개월 권고 날짜 변경
   * 
   * @param UserChgPwdDateDto
   * @returns 비밀번호 3개월 권고일 변경
   ************************************************/
  @Put('last-pw-chg-date')
  @ApiOperation({
    summary: '비밀번호 권고일 변경 API',
    description: '관리 포탈 비밀번호 3개월 권고일 변경',
  })
  async updateLastPwChgDate(@Body() props
    , @TransactionParam() transaction: Transaction
  ) {
    return this.userService.updateLastPwChgDate({ props, transaction });
  }

  /*************************************************
   * 기관 별 사용자 조회
   * 
   * @returns 기관 별 사용자 
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('organization/:organizationCd')
  @ApiOperation({
    summary: '기관 별 사용자 조회',
    description: '기관 별 사용자 조회',
  })
  @ApiParam({ name: 'organizationCd' })
  @ApiQuery({ type: CommonPageDto })
  async getOrganizationUsers(@Query() props
    , @Req() req
    , @Param('organizationCd') path: any
    , @TransactionParam() transaction: Transaction) {
    const user = req.user;
    props['organizationCd'] = path;
    return this.userService.getOrganizationUsers({ props, user, transaction });
  }

  /*************************************************
   * 사용자 서명 조회 - 마이페이지
   * 
   * @param 
   * @returns 사용자 서명 조회
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('/sign')
  @ApiOperation({
    summary: '사용자 서명 조회',
    description: '사용자 서명 조회',
  })
  async getUserSign(@Query() props
    , @Request() req
    , @TransactionParam() transaction: Transaction) {
    const user = req.user;
    return this.userService.getUserSign({ props, user, transaction });
  }

  /*************************************************
   * 사용자 서명 등록/업데이트
   * 
   * @param 
   * @returns  사용자 서명 등록/업데이트
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('/sign')
  @ApiOperation({
    summary: '사용자 서명 등록/업데이트 API',
    description: '사용자 서명 등록/업데이트',
  })
  @UseInterceptors(FilesInterceptor('files'))
  async insertUserSign(@Body() props,
    @Req() req,
    @TransactionParam() transaction: Transaction,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    const user = req.user;
    props = JSON.parse(props.body)
    props['files'] = files
    return this.userService.insertUserSign({ props, user, transaction });
  }

  /*************************************************
   * 사용자 서명 원본이미지
   * 
   * @param 
   * @returns 사용자 서명 원본이미지
   ************************************************/
  @Get('/sign-image/:id')
  @ApiOperation({
    summary: '사용자 서명 원본이미지',
    description: '',
  })
  async getUserSignImage(@Query() props,
    @Request() req,
    @Param('id') id: string,
    @TransactionParam() transaction: Transaction
  ): Promise<StreamableFile> {
    const user = req.user;
    props['userId'] = id
    return this.userService.getUserSignImage({ props, user, transaction });
  }

  /*************************************************
   * 사용자 서명 삭제
   * 
   * @param 
   * @returns  사용자 서명 삭제
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Delete('/sign')
  @ApiOperation({
    summary: '사용자 서명 삭제 API',
    description: '사용자 서명 삭제',
  })
  async deleteUserSign(@Body() props,
    @Req() req,
    @TransactionParam() transaction: Transaction,
  ) {
    const user = req.user;
    return this.userService.deleteUserSign({ props, user, transaction });
  }

  /*************************************************
   * 본인확인
   * 
   * @param 
   * @returns 본인확인
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('/check')
  @ApiOperation({
    summary: '본인확인',
    description: '본인확인',
  })
  async getCheckAuth(@Query() props
    , @Request() req
    , @TransactionParam() transaction: Transaction) {
    const user = req.user;
    return this.userService.getCheckAuth({ props, user, transaction });
  }

  /*************************************************
   * 연구책임자 서명 본인확인 간편비밀번호
   * 
   * @param 
   * @returns 연구책임자 서명 본인확인 간편비밀번호
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('/sign-password')
  @ApiOperation({
    summary: '연구책임자 서명 본인확인',
    description: '연구책임자 서명 본인확인 간편비밀번호',
  })
  async getCheckSignPassword(@Query() props
    , @Request() req
    , @TransactionParam() transaction: Transaction) {
    const user = req.user;
    return this.userService.getCheckSignPassword({ props, user, transaction });
  }
  /**********************[사용자 관리]***********************/
  /*************************************************
   * 사용자 리스트 User
   * 
   * @param 
   * @returns 사용자 리스트
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('list')
  @ApiOperation({
    summary: 'user 리스트',
    description: 'user 리스트',
  })
  @ApiQuery({ type: CommonPageDto })
  async getUesrList(@Query() props
    , @Request() req
    , @TransactionParam() transaction: Transaction) {
    const user = req.user;
    return this.userService.getUesrList({ props, user, transaction });
  }


  /*************************************************
   * 사용자 상태 변경 
   * -> 승인, 거절
   * 
   * @param {String} users
   * @param {String} statusCd 
   * @returns 사용자 상태 변경 성공여부
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('status')
  @ApiOperation({
    summary: '사용자 상태 변경',
    description: '사용자 상태 변경',
  })

  async updateUserStatus(@Request() req
    , @TransactionParam() transaction: Transaction
  ) {
    const user = req.user;
    let props: any = req.body;
    return this.userService.updateUserStatus({ props, user, transaction });
  }


  /*************************************************
   * 사용자 상세
   * 
   * @param 
   * @returns 사용자 상세
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('/info')
  @ApiOperation({
    summary: '사용자 상세',
    description: '사용자 상세',
  })
  async getUserInfo(@Query() props
    , @Request() req
    , @TransactionParam() transaction: Transaction) {
    const user = req.user;
    return this.userService.getUserInfo({ props, user, transaction });
  }



  /*************************************************
   * 사용자 로그인 내역 리스트
   * 
   * @param 
   * @returns 사용자 리스트
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('/login-history')
  @ApiOperation({
    summary: 'user login history 리스트',
    description: 'user login history 리스트',
  })
  @ApiQuery({ type: CommonPageDto })
  async getUesrLoginHistory(@Query() props
    , @Request() req
    , @TransactionParam() transaction: Transaction) {
    const user = req.user;
    return this.userService.getUesrLoginHistory({ props, user, transaction });
  }


  /*************************************************
   * 사용자 휴대번호 중복체크
   * 
   * @param 
   * @returns 사용자 휴대번호 중복체크
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('/mobile-no/:id')
  @ApiOperation({
    summary: '사용자 휴대번호 중복체크',
    description: '사용자 휴대번호 중복체크',
  })
  async getUserMobileNo(@Query() props
    , @Param('id') id: string
    , @Request() req
    , @TransactionParam() transaction: Transaction) {
    const user = req.user;
    props['id'] = id
    return this.userService.getUserMobileNo({ props, user, transaction });
  }

  /*************************************************
   * 관리포탈 - 회원 관리 (권한수정)
   * 
   * @param 
   * @returns 관리포탈 - 회원 관리 (권한수정)
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Put('/auth')
  @ApiOperation({
    summary: '관리포탈 - 회원 관리 (권한수정)',
    description: '관리포탈 - 회원 관리',
  })
  // @ApiBody({ type: UserChgPwdDateDto })
  async updateUserAuth(@Body() props
    , @Request() req
    , @TransactionParam() transaction: Transaction
  ) {
    const user = req.user;
    return this.userService.updateUserAuth({ props, user, transaction });
  }
  /*************************************************
   * 관리포탈 - 회원 관리 (수정)
   * 
   * @param 
   * @returns 관리포탈 - 회원 관리
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Put('/')
  @ApiOperation({
    summary: '관리포탈 - 회원 관리',
    description: '관리포탈 - 회원 관리',
  })
  // @ApiBody({ type: UserChgPwdDateDto })
  async updateUser(@Body() props
    , @Request() req
    , @TransactionParam() transaction: Transaction
  ) {
    const user = req.user;
    return this.userService.updateUser({ props, user, transaction });
  }

  /*************************************************
   * 관리포탈 - 회원 탈퇴
   * 
   * @param 
   * @returns  관리포탈 - 회원 탈퇴 
   * DELETE로 했을 시 Body를 못 받음으로 put 으로 처리
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Put('/secession')
  @ApiOperation({
    summary: '관리포탈 - 회원 탈퇴',
    description: '관리포탈 - 회원 탈퇴',
  })
  async deleteUser(@Body() props,
    @Req() req,
    @TransactionParam() transaction: Transaction,
  ) {
    const user = req.user;
    return this.userService.deleteUser({ props, user, transaction });
  }
  /*************************************************
   * 사용자 비밀번호 리셋
   * 
   * @param {String} userId 
   * @param {String} userPwd 
   * @returns 사용자 비밀번호 리셋 성공여부
   ************************************************/
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('JWT')
  // @Post('/reset-pwd')
  // @ApiOperation({
  //      summary: '사용자 비밀번호 리셋',
  //      description: '사용자 비밀번호 리셋',
  // })
  // @ApiBody({type : UserResetPwdDto})
  // async resetPassword(@Req() req , @TransactionParam() transaction: Transaction ) {
  //   const user = req.user;
  //   let props: any = req.body;
  //   return this.userService.resetPassword({props , user , transaction});
  // }



}
