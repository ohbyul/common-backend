import { Controller, Get, Put, Post, Body, Param, Delete, Req, UseGuards, UseInterceptors, UploadedFiles, Query, } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UserParam } from 'src/decorator/user.deco';

// Constructor
import { BoardService } from './board.service';

// DTO
import { RequestUserDto } from 'src/dto/base/request.user.dto';

import { BoardDto } from 'src/dto/board/board.dto';
import { BoardSearchDto } from 'src/dto/board/board.search.dto';

/*************************************************
 *
 * 게시판 기능
 * 
 * @author  : b.oh
 * @since   : 2023-12-20
 * @see     : 확인 가능한 링크
 *
 *
 * << 개정이력(Modification Information) >>
 *
 * 수정일        수정자   수정사항
 * ------------ -------- ------------------------
 * 2023-12-20   오  별    최초 생성
 * 2023-12-27   오  별    트랜잭션제거 
 * 2024-01-04   오  별    사용자 조회조건 기능추가 (bug 수정은 작성하지 않는다.)
 * ----------------------------------------------
 *
 ************************************************/
@ApiTags('BOARD API')
@Controller('/api/board')
export class BoardController {

  constructor(
    private boardService: BoardService
  ) { }

  /*************************************************   
   * @description    게시글 리스트
   * @param          {BoardSearchDto} props
   * @param          {string} bbsKindCd
   * @returns        게시글 리스트
   * @todo           쿼리는 number로 못 받나
   ************************************************/
  @Get('/public/:bbsKindCd')
  @ApiOperation({ summary: '게시글 리스트', description: '게시글 리스트' })
  @ApiQuery({ type: BoardSearchDto })
  @ApiParam({ name: 'bbsKindCd' })
  async getBoardList(
    @Query() props: BoardSearchDto,
    @Param('bbsKindCd') bbsKindCd: string,
  ) {
    props.bbsKindCd = bbsKindCd;

    return this.boardService.getBoardList(props);
  }

  /*************************************************   
   * @description    게시글 상세
   * @param          {BoardDto} props
   * @param          {string} bbsKindCd
   * @param          {string} id
   * @returns        게시글 상세 데이터
   ************************************************/
  @Get('/public/:bbsKindCd/:id')
  @ApiOperation({ summary: '게시글 상세', description: '게시글 상세', })
  @ApiQuery({ type: BoardDto })
  @ApiParam({ name: 'bbsKindCd' })
  @ApiParam({ name: 'id' })
  async getBoardInfo(
    @Query() props: BoardDto,
    @Param('bbsKindCd') bbsKindCd: string,
    @Param('id') id: string,
  ) {
    props.bbsKindCd = bbsKindCd;
    props.id = id;

    return this.boardService.getBoardInfo(props);
  }





  /*************************************************   
   * @description    게시글 등록
   * @param          {BoardDto} props
   * @param          {string} bbsKindCd
   * @returns        게시글 등록 성공여부
   * @todo           파일처리
   ************************************************/
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('JWT')
  @Post('/:bbsKindCd')
  @ApiOperation({ summary: '게시글 등록', description: '게시글 등록 ', })
  @ApiBody({ type: BoardDto })
  @ApiParam({ name: 'bbsKindCd' })
  @UseInterceptors(FilesInterceptor('files'))
  async insertBoard(
    @Body() props: BoardDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('bbsKindCd') bbsKindCd: string,
    @UserParam() user: RequestUserDto,
  ) {
    props.bbsKindCd = bbsKindCd;
    props.files = files

    // [case1]
    // let result = this.boardService.insertBoard(props, user)
    // let dataProps: BoardSearchDto = { bbsKindCd: 'NOTICE', page: 1, pageLength: 10 }
    // let result2 = this.boardService.getBoardsTotalCount(dataProps)
    // return result2;

    // [case2]
    return this.boardService.insertBoard(props, user);
  }










  /*************************************************   
   * @description    게시글 수정
   * @param          {BoardDto} props
   * @param          {string} bbsKindCd
   * @param          {string} id
   * @returns        게시글 수정 성공여부
   * @todo           파일처리
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Put('/:bbsKindCd/:id')
  @ApiOperation({ summary: '게시글 수정', description: '게시글 수정 ', })
  @ApiBody({ type: BoardDto })
  @ApiParam({ name: 'bbsKindCd' })
  @ApiParam({ name: 'id' })
  @UseInterceptors(FilesInterceptor('files'))
  async updateBoard(
    @Body() props: BoardDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('bbsKindCd') bbsKindCd: string,
    @Param('id') id: string,
    @UserParam() user: RequestUserDto,
  ) {
    props.bbsKindCd = bbsKindCd;
    props.id = id;
    props.files = files

    return this.boardService.updateBoard(props, user)
  }


  /*************************************************   
   * @description    게시글 삭제
   * @param          {string} id
   * @returns        게시글 삭제 성공여부
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Delete('/:id')
  @ApiOperation({ summary: '게시글 삭제', description: '게시글 삭제', })
  @ApiParam({ name: 'id' })
  async deleteBoard(
    @Param('id') id: string,
    @UserParam() user: RequestUserDto,
  ) {

    return this.boardService.deleteBoard(id, user)
  }

}
