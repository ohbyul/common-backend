import { Controller, Get, Put, Post, Body, Param, Delete, Req, UseGuards, UseInterceptors, UploadedFiles, Query, } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
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
 * 2023-12-26   오  별    샘플 컨트롤러 
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
   ************************************************/
  @Get('/public/:bbsKindCd')
  async getBoardList(
    @Query() props: BoardSearchDto,
    @Param('bbsKindCd') bbsKindCd: string,
  ) {
    props['bbsKindCd'] = bbsKindCd;

    // [case1] Partial
    let test: Partial<BoardSearchDto> = {}
    test.page = 1;
    console.log(test.page);

    // [case2] new
    let test2: BoardSearchDto = new BoardSearchDto()
    test2.page = 2;
    console.log(test2.page);


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
  @UseGuards(JwtAuthGuard)
  @Post('/:bbsKindCd')
  async insertBoard(
    @Body() props: BoardDto,
    @Param('bbsKindCd') bbsKindCd: string,
    @UserParam() user: RequestUserDto,
  ) {
    props.bbsKindCd = bbsKindCd;

    return this.boardService.insertBoard(props, user)
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
  @Put('/:bbsKindCd/:id')
  async updateBoard(
    @Body() props: BoardDto,
    @Param('bbsKindCd') bbsKindCd: string,
    @Param('id') id: string,
    @UserParam() user: RequestUserDto,
  ) {
    props.bbsKindCd = bbsKindCd;
    props.id = id;

    return this.boardService.updateBoard(props, user)
  }


  /*************************************************   
   * @description    게시글 삭제
   * @param          {string} id
   * @returns        게시글 삭제 성공여부
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async deleteBoard(
    @Param('id') id: string,
    @UserParam() user: RequestUserDto,
  ) {

    return this.boardService.deleteBoard(id, user)
  }

}
