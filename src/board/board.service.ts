import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BoardQuery } from './board.queries';
import AWS from 'aws-sdk';
import { CloudApi } from 'src/lib/cloud-api';
import { BoardDto } from 'src/dto/board/board.dto';
import { SearchDto } from 'src/dto/base/search.dto';
import { BoardSearchDto } from 'src/dto/board/board.search.dto';
import { RequestUserDto } from 'src/dto/base/request.user.dto';
import { Transactional } from 'sequelize-transactional-decorator';

@Injectable()
export class BoardService {
  private FILE_PATH = "bbs-attachment-file";

  constructor(
    private boardQuery: BoardQuery,
  ) { }

  /*************************************************   
   * @description    게시글 리스트
   * @param          {BoardSearchDto} props
   * @returns        게시글 리스트
   ************************************************/
  @Transactional()
  async getBoardList(props: BoardSearchDto) {
    let { page, pageLength, bbsKindCd } = props;
    page = Number(page) === 0 ? 1 : Number(page);
    const offset = (page - 1) * pageLength;
    props.offset = offset

    // [1] 리스트 
    const reulstList: object[] = await this.boardQuery.getBoardList(props);

    if (reulstList.length > 0) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: reulstList,
      };
    } else {
      return {
        statusCode: 10000,
        message: '게시글이 없습니다.',
        data: [],
      };
    }
  }

  /*************************************************   
   * @description    게시글 상세
   * @param          {BoardDto} props
   * @returns        게시글 상세 데이터
   * @exception      InternalServerErrorException
   * @todo           getFiles
   ************************************************/
  @Transactional()
  async getBoardInfo(props: BoardDto) {

    // [0] 상세 Info
    let boardInfo: any = await this.boardQuery.getBoardInfo(props);
    if (!boardInfo) throw new InternalServerErrorException({ statusCode: 10003 })

    return {
      statusCode: 10000,
      message: '정상적으로 조회되었습니다.',
      data: boardInfo,
    };

  }





  /*************************************************   
   * @description    게시글 등록
   * @param          {BoardDto} props
   * @param          {RequestUserDto} user
   * @returns        게시글 등록 성공여부
   * @exception      InternalServerErrorException
   * @todo           insert files
   ************************************************/
  @Transactional()
  async insertBoard(props: BoardDto, user: RequestUserDto) {

    let id: any = await this.boardQuery.insertBoard(props, user)
    if (!id) throw new InternalServerErrorException({ statusCode: 10002 })

    let dataProps: BoardSearchDto = { bbsKindCd: 'NOTICE', page: 1, pageLength: 10 }
    const result = await this.getBoardsTotalCount(dataProps)
    return {
      statusCode: 10000,
      message: '성공',
      data: id,
    };
  }


  /*************************************************   
   * @description    테스트를 위한 게시글 totalCount
   * @param          {BoardSearchDto} props
   * @returns        totalCount
   ************************************************/
  // @Transactional()
  async getBoardsTotalCount(props: BoardSearchDto) {
    const totalCount: Number = await this.boardQuery.getBoardTotalCount(props);
    throw new InternalServerErrorException({ statusCode: 10003 })
    return totalCount
  }








  /*************************************************   
   * @description    게시글 수정
   * @param          {BoardDto} props
   * @param          {RequestUserDto} user
   * @returns        게시글 수정 성공여부
   * @todo           insert/delete files
   ************************************************/
  @Transactional()
  async updateBoard(props: BoardDto, user: RequestUserDto) {

    await this.boardQuery.updateBoard(props, user)

    return {
      statusCode: 10000,
      message: '게시글 수정이 정상적으로 되었습니다.',
    };
  }

  /*************************************************   
   * @description    게시글 삭제
   * @param          {string} id
   * @param          {RequestUserDto} user
   * @returns        게시글 삭제 성공여부
   * @todo           delete files
   ************************************************/
  @Transactional()
  async deleteBoard(id: string, user: RequestUserDto) {

    await this.boardQuery.deleteBoard(id, user)

    return {
      statusCode: 10000,
      message: '게시글이 정상적으로 삭제되었습니다.',
    };
  }



}
