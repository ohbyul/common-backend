import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { RequestUserDto } from 'src/dto/base/request.user.dto';
import { BoardDto } from 'src/dto/board/board.dto';
import { BoardSearchDto } from 'src/dto/board/board.search.dto';
import { COMMON } from 'src/entitys/common/common.model';

@Injectable()
export class BoardQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON,
  ) { }

  private AES_SECRETKEY = process.env['AES_SECRETKEY'];

  /*************************************************   
   * @description    게시글 리스트
   * @param          {BoardSearchDto} props
   * @returns        게시글 리스트
   ************************************************/
  async getBoardList(props: BoardSearchDto) {
    const { offset, pageLength, bbsKindCd } = props;

    const reulstList: any = await this.CommonModel.sequelize.query(
      `
      SELECT *
        FROM TB_BBS tb  
       WHERE 1=1
         AND tb.DELETE_YN = 'N'
         ${bbsKindCd ? 'AND tb.BBS_KIND_CD = :bbsKindCd' : ''}
        LIMIT ${offset}, ${pageLength}
      `,
      {
        replacements: {
          bbsKindCd: bbsKindCd
        },
        type: QueryTypes.SELECT,
        mapToModel: true
      },
    );

    return reulstList;
  }

  async getBoardTotalCount(props: BoardSearchDto) {
    const { bbsKindCd } = props;

    const reuslt: any = await this.CommonModel.sequelize.query(
      `
      SELECT COUNT(tb.ID) AS totalCount
        FROM TB_BBS tb  
       WHERE 1=1
         AND tb.DELETE_YN = 'N'
         ${bbsKindCd ? 'AND tb.BBS_KIND_CD = :bbsKindCd' : ''}
      `,
      {
        replacements: {
          bbsKindCd: bbsKindCd
        },
        type: QueryTypes.SELECT,
        mapToModel: true
      },
    );

    return reuslt[0].totalCount;
  }

  /*************************************************   
   * @description    게시글 상세
   * @param          {BoardDto} props
   * @returns        게시글 상세 데이터
   ************************************************/
  async getBoardInfo(props: BoardDto) {
    const { id, bbsKindCd } = props
    const boardInfoQuery: any = await this.CommonModel.sequelize.query(
      `
          SELECT tb.ID 
                ,tb.TITLE 
                ,tb.CONTENTS 
                ,tb.BBS_KIND_CD 
                ,tb.DELETE_YN
                ,tb.CREATE_LOGIN_ID
                ,tb.CREATE_DTM 
                ,tb.MODIFY_LOGIN_ID
                ,tb.MODIFY_DTM
            FROM TB_BBS tb 
           WHERE 1=1
             AND tb.DELETE_YN = 'N'
             AND tb.ID = :id
             AND tb.BBS_KIND_CD = :bbsKindCd
      `,
      {
        replacements: {
          id: id,
          bbsKindCd: bbsKindCd,
        },
        type: QueryTypes.SELECT,
        mapToModel: true
      },
    );

    return boardInfoQuery[0];
  }

  /*************************************************   
   * @description    게시글 등록
   * @param          {BoardDto} props
   * @param          {RequestUserDto} user
   * @param          {Transaction} transaction
   * @returns        게시글 등록 성공여부
   ************************************************/
  async insertBoard(props: BoardDto, user: RequestUserDto) {
    const { title, contents, bbsKindCd, deleteYn = 'N' } = props;
    // const { userId } = user

    let result: any = await this.CommonModel.sequelize.query(
      `
      INSERT INTO TB_BBS(
            BBS_KIND_CD
            ,TITLE
            ,CONTENTS
            ,DELETE_YN
            ,CREATE_LOGIN_ID
            ,CREATE_DTM
            ,MODIFY_LOGIN_ID
            ,MODIFY_DTM
            )
      VALUES(
            :bbsKindCd
            ,:title
            ,:contents
            ,:deleteYn
            ,:userId
            ,now()
            ,:userId
            ,now()
          )
      `,
      {
        replacements: {
          bbsKindCd,
          title,
          contents,
          deleteYn: deleteYn ?? 'N',
          userId: 'admin',
        },
        type: QueryTypes.INSERT,
        mapToModel: true,
      },
    );

    return result[0];
  }


  /*************************************************   
   * @description    게시글 수정
   * @param          {BoardDto} props
   * @param          {RequestUserDto} user
   * @param          {Transaction} transaction
   * @returns        게시글 수정 성공여부
   ************************************************/
  async updateBoard(props: BoardDto, user: RequestUserDto) {
    const { id, title, contents, bbsKindCd, deleteYn = 'N' } = props;
    const { userId } = user

    await this.CommonModel.sequelize.query(
      `
      UPDATE TB_BBS
         SET TITLE =:title
            ,CONTENTS =:contents
            ,DELETE_YN =:deleteYn
            ,MODIFY_LOGIN_ID =:userId
            ,MODIFY_DTM =now()
       WHERE ID = :id
      `,
      {
        replacements: {
          id: id,
          title: title,
          contents: contents,
          deleteYn: deleteYn,
          userId: userId,
        },
        type: QueryTypes.INSERT,
        mapToModel: true,
      },
    );
  }


  /*************************************************   
   * @description    게시글 삭제
   * @param          {string} id
   * @param          {RequestUserDto} user
   * @param          {Transaction} transaction
   * @returns        게시글 삭제 성공여부
   ************************************************/
  async deleteBoard(id: string, user: RequestUserDto) {
    const { userId } = user

    await this.CommonModel.sequelize.query(
      `
      UPDATE TB_BBS
        SET DELETE_YN = 'Y'
          ,MODIFY_LOGIN_ID = :userId
          ,MODIFY_DTM = now()
        WHERE ID = :id
      `
      ,
      {
        replacements: {
          userId: userId,
          id: id
        },
        type: QueryTypes.UPDATE,
        mapToModel: true
      },
    );
  }


}
