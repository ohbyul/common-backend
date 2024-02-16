import { Inject, Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { MSGTemplatesDto } from 'src/dto/common/msg-templates.dto';

@Injectable()
export class CommonQuery {
  private batchName = process.env['BATCH_NAME'];
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON
  ) { }

  private aesSecretkey = process.env['AES_SECRETKEY'];

  /*************************************************
   * 사용자 권한별 메뉴 리스트
   * 
   * @param userId
   * @returns 메뉴 리스트
   ************************************************/
  async getMenuList(params: any) {
    let { props, transaction, menuJoinString } = params;

    const resultList: any = await this.CommonModel.sequelize.query(
      `
          SELECT tm.MENU_ID  
                ,tm.MENU_NM  
                ,tm.MENU_URL  
                ,tm.UPPER_MENU_ID 
                ,tm.MENU_LEVEL 
                ,tm.MENU_ICON 
                ,tm.SNB_YN 
                ,tm.SORT_ORDER 
                ,tm.LOGIN_YN
                ,tm.DELETE_YN
                ,( SELECT IF(MAX(tm2.MENU_ID) IS NULL , 'N' , 'Y') FROM TB_MENU tm2 WHERE tm2.UPPER_MENU_ID = tm.MENU_ID ) AS CHILD_YN
          FROM TB_MENU tm 
                ${menuJoinString}
          WHERE 1=1
            AND tm.DELETE_YN = 'N'
            AND tm.MENU_YN ='Y'
          ORDER BY tm.MENU_LEVEL ASC, tm.SORT_ORDER ASC
        `,
      {
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return resultList;
  }

  /*************************************************
   * url path 권한 여부
   * 
   * @param userId
   * @returns 
   ************************************************/
  async getMenuAuth(params: any) {
    let { props, payload, transaction } = params;
    let { path } = props
    let { userId } = payload

    const resultList: any = await this.CommonModel.sequelize.query(
      `
          SELECT tm.MENU_ID  
                ,tm.MENU_NM  
                ,tm.MENU_URL  
                ,tm.UPPER_MENU_ID 
                ,tm.MENU_LEVEL 
                ,tm.MENU_ICON 
                ,tm.SNB_YN 
                ,tm.SORT_ORDER 
                ,tm.LOGIN_YN
                ,tm.DELETE_YN
          FROM TB_MENU tm 
          JOIN TB_MENU_AUTH tma ON tm.MENU_ID = tma.MENU_ID AND tma.DELETE_YN = 'N'
          JOIN TB_USER tu ON tma.AUTH_CD = tu.AUTH_CD AND tu.STATUS_CD = 'APPROVAL' AND tu.LOGIN_ID = :userId
          WHERE 1=1
            AND tm.DELETE_YN = 'N'
            AND SUBSTRING_INDEX(tm.MENU_URL,'?',1) = :path
          ORDER BY tm.MENU_LEVEL ASC, tm.SORT_ORDER ASC
        `,
      {
        replacements: {
          path,
          userId
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return resultList;
  }
  /*************************************************
   * 기관리스트 조회
   * 
   * @returns 전체 기관 리스트
   ************************************************/
  async getOrganizationList(params: any) {
    let { offset, pageLength, whereOptionString, orderOptionString, transaction } = params;
    const resultList: any = await this.CommonModel.sequelize.query(
      `
          SELECT tog.ID 
                ,tog.ORGANIZATION_CD 
                ,tog.ORGANIZATION_NM 
                ,tog.SIMPLE_NM 
                ,tcc.COMM_CD_NM
                ,tog.ORGANIZATION_TYPE_CD 
                ,tog.REGION 
                ,tog.ZIP_CODE 
                ,tog.ADDRESS 
                ,tog.ADDRESS_DETAIL 
                ,tog.CEO 
                ,tog.SORT_ORDER 
                ,tog.CREATE_DTM 
                ,(SELECT COUNT(tu.ID) FROM TB_USER tu WHERE tu.ORGANIZATION_CD = tog.ORGANIZATION_CD AND tu.STATUS_CD = 'APPROVAL' ) AS USER_COUNT
            FROM TB_ORGANIZATION tog
           INNER JOIN TB_COMM_CD tcc ON tcc.COMM_CD = tog.ORGANIZATION_TYPE_CD AND tcc.DELETE_YN = 'N'
           INNER JOIN TB_COMM_GROUP_CD tcgc ON tcgc.GROUP_CD = tcc.GROUP_CD AND tcgc.DELETE_YN = 'N' AND tcgc.GROUP_CD = 'ORGANIZATION_TYPE'
           WHERE 1=1
             AND tog.DELETE_YN = 'N'
            ${whereOptionString}
            ${orderOptionString}
           LIMIT ${offset}, ${pageLength}
        `,
      {
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return resultList;
  }

  async getOrganizationTotalCount(params: any) {
    let { whereOptionString, transaction } = params;
    let totalCount: any = await this.CommonModel.sequelize.query(
      `
          SELECT COUNT(tog.ID) as totalCount
            FROM TB_ORGANIZATION tog
           INNER JOIN TB_COMM_CD tcc ON tcc.COMM_CD = tog.ORGANIZATION_TYPE_CD AND tcc.DELETE_YN = 'N'
           INNER JOIN TB_COMM_GROUP_CD tcgc ON tcgc.GROUP_CD = tcc.GROUP_CD AND tcgc.DELETE_YN = 'N' AND tcgc.GROUP_CD = 'ORGANIZATION_TYPE'
           WHERE 1=1
             AND tog.DELETE_YN = 'N'
            ${whereOptionString}
      `,
      { type: QueryTypes.SELECT, transaction },
    );

    return totalCount[0].totalCount;
  }

  /*************************************************
   * 세션 기관 정보
   * 
   * @returns 세션 기관 정보
   ************************************************/
  async getOrganizationInfoByOrganizationCd(params: any) {
    let { props, user, transaction } = params
    let { userId } = user
    let { organizationCd } = props
    const result: any = await this.CommonModel.sequelize.query(
      `
          SELECT tog.ID 
                ,tog.ORGANIZATION_CD 
                ,tog.ORGANIZATION_NM 
                ,tog.SIMPLE_NM
                ,tog.ORGANIZATION_TYPE_CD 
                ,(SELECT tcc.COMM_CD_NM  FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tog.ORGANIZATION_TYPE_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'ORGANIZATION_TYPE') AS ORGANIZATION_TYPE_CD_NM
                ,tog.REGION 
                ,tog.ZIP_CODE 
                ,tog.ADDRESS 
                ,tog.ADDRESS_DETAIL 
                ,tog.CEO 
                ,tog.PHONE_NO
                ,tog.SORT_ORDER 
                ,tog.DELETE_YN
           FROM TB_ORGANIZATION tog
          WHERE 1=1
            AND tog.ORGANIZATION_CD =:organizationCd
        `,
      {
        replacements: {
          organizationCd: organizationCd,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return result[0];
  }

  /*************************************************
  * 기관 정보
  * 
  * @returns 기관 정보
  ************************************************/
  async getOrganizationInfoById(params: any) {
    let { props, user, transaction } = params
    let { id } = props
    const result: any = await this.CommonModel.sequelize.query(
      `
          SELECT tog.ID 
                ,tog.ORGANIZATION_CD 
                ,tog.ORGANIZATION_NM 
                ,tog.SIMPLE_NM
                ,tog.ORGANIZATION_TYPE_CD 
                ,(SELECT tcc.COMM_CD_NM  FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tog.ORGANIZATION_TYPE_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'ORGANIZATION_TYPE') AS ORGANIZATION_TYPE_CD_NM
                ,tog.REGION 
                ,tog.ZIP_CODE 
                ,tog.ADDRESS 
                ,tog.ADDRESS_DETAIL 
                ,tog.CEO 
                ,tog.PHONE_NO
                ,tog.SORT_ORDER 
                ,tog.DELETE_YN
                ,tog.CREATE_LOGIN_ID 
                ,tog.CREATE_DTM 
                ,tog.MODIFY_LOGIN_ID 
                ,tog.MODIFY_DTM 
                ,(SELECT IF(COUNT(tpo.ID), 'Y' , 'N' ) FROM TB_PROJECT_ORGANIZATION tpo WHERE tpo.ORGANIZATION_CD = tog.ORGANIZATION_CD AND tpo.DELETE_YN = 'N') AS PARTICIPANT_YN
           FROM TB_ORGANIZATION tog
          WHERE 1=1
            AND tog.ID =:id
        `,
      {
        replacements: {
          id: id,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return result[0];
  }

  /*************************************************
   * 기관등록   
   * 
   * @param 
   * @returns 기관등록 생성 성공여부
   ************************************************/
  async insertOrganization(params: any) {
    let { transaction, user, props } = params;
    let { organizationTypeCd, organizationNm, simpleNm, organizationCd, ceo
      , region, zipCode, address, addressDetail, phoneNo
    } = props;
    let { userId } = user

    let createQuery: any = await this.CommonModel.sequelize.query(
      `
        INSERT INTO TB_ORGANIZATION (
              ORGANIZATION_CD
              ,ORGANIZATION_NM
              ,SIMPLE_NM
              ,ORGANIZATION_TYPE_CD
              ,REGION
              ,ZIP_CODE
              ,ADDRESS
              ,ADDRESS_DETAIL
              ,CEO
              ,PHONE_NO
              ,SORT_ORDER
              ,DELETE_YN
              ,CREATE_LOGIN_ID, CREATE_DTM, MODIFY_LOGIN_ID, MODIFY_DTM
          ) VALUES ( 
            :organizationCd
            ,:organizationNm
            ,:simpleNm
            ,:organizationTypeCd
            ,:region
            ,:zipCode
            ,:address
            ,:addressDetail
            ,:ceo
            ,:phoneNo
            ,null
            ,'N'
            ,:userId , now() ,:userId ,now() 
          ) 
        `,
      {
        replacements: {
          organizationCd,
          organizationNm,
          simpleNm,
          organizationTypeCd,
          region,
          zipCode,
          address,
          addressDetail,
          ceo,
          phoneNo,
          userId,
        },
        type: QueryTypes.INSERT, transaction
      },
    );

    return createQuery[0];
  }

  /*************************************************
   * 기관 정보 수정
   * 
   * @returns 기관 정보 수정
   ************************************************/
  async updateOrganization(params: any) {
    let { props, user, transaction } = params;
    let { userId } = user
    let { organizationId
      , organizationTypeCd, organizationNm, simpleNm, organizationCd, ceo
      , region, zipCode, address, addressDetail, phoneNo, deleteYn
    } = props;

    let result: any = await this.CommonModel.sequelize.query(
      `
      UPDATE TB_ORGANIZATION 
         SET ORGANIZATION_NM = :organizationNm
            ,SIMPLE_NM = :simpleNm
            ,ORGANIZATION_TYPE_CD = :organizationTypeCd
            ,ORGANIZATION_CD=:organizationCd
            ,REGION = :region
            ,ZIP_CODE = :zipCode
            ,ADDRESS = :address
            ,ADDRESS_DETAIL = :addressDetail
            ,CEO = :ceo
            ,PHONE_NO = :phoneNo
            ,DELETE_YN = :deleteYn
            ,MODIFY_DTM  = now()
            ,MODIFY_LOGIN_ID = :userId
      WHERE 1=1
        AND ID = :organizationId
      `,
      {
        replacements: {
          organizationId,

          organizationNm,
          simpleNm,
          organizationTypeCd,
          organizationCd,

          region,
          zipCode,
          address,
          addressDetail,

          ceo,
          phoneNo,
          deleteYn,

          userId,
        },
        type: QueryTypes.UPDATE, transaction,
      },
    );

    return result[0];
  }
  /*************************************************
   * 그룹CD별 코드 리스트 조회   
   * 
   * @returns 그룹CD별 코드 리스트
   ************************************************/
  async getCommonCodeList(params: any) {
    let { props, transaction } = params
    let { groupCd } = props
    const resultList: any = await this.CommonModel.sequelize.query(
      `
          SELECT tcc.COMM_CD 
                ,tcc.GROUP_CD 
                ,tcc.COMM_CD_NM 
                ,tcc.COMM_CD_DESC 
                ,tcc.SORT_ORDER 
           FROM TB_COMM_GROUP_CD tcgc 
          INNER JOIN TB_COMM_CD tcc ON tcc.GROUP_CD = tcgc.GROUP_CD AND tcc.DELETE_YN = 'N'
            AND tcgc.DELETE_YN = 'N'
            AND tcgc.GROUP_CD = :groupCd
          ORDER BY tcc.SORT_ORDER ASC
        `,
      {
        replacements: {
          groupCd,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return resultList;
  }

  /*************************************************
   * 그룹CD별 코드 값 조회
   * 
   * @returns 그룹CD별 코드 리스트
   ************************************************/
  async getCommonCodeValue(params: any) {
    let { props, transaction } = params
    let { groupCd, commCd } = props

    const result: any = await this.CommonModel.sequelize.query(
      `
          SELECT tcc.COMM_CD 
                ,tcc.GROUP_CD 
                ,tcc.COMM_CD_NM 
                ,tcc.COMM_CD_DESC 
                ,tcc.SORT_ORDER 
           FROM TB_COMM_GROUP_CD tcgc 
          INNER JOIN TB_COMM_CD tcc ON tcc.GROUP_CD = tcgc.GROUP_CD AND tcc.DELETE_YN = 'N'
            AND tcgc.DELETE_YN = 'N'
            AND tcgc.GROUP_CD = :groupCd
            AND tcc.COMM_CD = :commCd
          ORDER BY tcc.SORT_ORDER ASC
        `,
      {
        replacements: {
          groupCd: groupCd,
          commCd: commCd
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );
    return result[0];
  }
  /*************************************************
   * 메세지 템플릿 조회
   * 
   * @returns 발송메세지 템플릿 코드 리스트
   ************************************************/
  async getMSGTemplates(params: any): Promise<MSGTemplatesDto> {
    let { taskTypeCd } = params
    const resultList: any = await this.CommonModel.sequelize.query(
      `
        SELECT ID as id
              ,MSG_TYPE_CD as msgTypeCd
              ,TASK_TYPE_CD as taskTypeCd
              ,SENDER as sender
              ,TITLE as title
              ,CONTENTS as contents
              ,FILE_NM as fileNm
              ,FILE_PATH as filePath
          FROM TB_MSG_TEMPLATES
         WHERE TASK_TYPE_CD = :taskTypeCd  
        `,
      {
        replacements: {
          taskTypeCd: taskTypeCd,
        },
        type: QueryTypes.SELECT,
        mapToModel: true,
      },
    );

    return resultList[0];
  }

  /*************************************************
   * 게시판 코드별 리스트 조회   
   * 
   * @returns 게시판 코드별  코드 리스트
   ************************************************/
  async getCommonBoardCodeList(params: any) {
    let { props, transaction } = params
    let { groupCd, upperCommCd } = props

    const resultList: any = await this.CommonModel.sequelize.query(
      `
        SELECT tcc.COMM_CD 
              ,tcc.GROUP_CD 
              ,tcc.COMM_CD_NM 
              ,tcc.COMM_CD_DESC 
              ,tcc.SORT_ORDER 
         FROM TB_COMM_GROUP_CD tcgc 
        INNER JOIN TB_COMM_CD tcc ON tcc.GROUP_CD = tcgc.GROUP_CD AND tcc.DELETE_YN = 'N'
          AND tcgc.DELETE_YN = 'N'
          AND tcgc.GROUP_CD = :groupCd
          AND tcc.UPPER_COMM_CD = :upperCommCd
        ORDER BY tcc.SORT_ORDER ASC
      `,
      {
        replacements: {
          groupCd: groupCd,
          upperCommCd: upperCommCd,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return resultList;
  }

  /*************************************************
   * 공휴일 데이터
   * 
   * @returns 성공실패
   ************************************************/
  async getHolidayList(params: any) {
    let { props, user, transaction
      , offset, pageLength, whereOptionString
    } = params
    let { userId } = user

    let resultList: any = await this.CommonModel.sequelize.query(
      `
          SELECT th.ID 
                ,th.HOLIDAY 
                ,th.HOLIDAY_NAME 
                ,th.CREATE_LOGIN_ID 
                ,th.CREATE_DTM 
                ,th.MODIFY_LOGIN_ID 
                ,(CASE 
                  WHEN th.MODIFY_LOGIN_ID != '${this.batchName}' 
                  THEN (SELECT CAST(AES_DECRYPT(UNHEX(USER_NM), :aesSecretkey, ENCRYPT_IV) AS CHAR) FROM TB_USER WHERE LOGIN_ID= th.MODIFY_LOGIN_ID) ELSE th.MODIFY_LOGIN_ID 
                  END
                 ) AS MODIFY_USER_NM
                ,th.MODIFY_DTM 
           FROM TB_HOLIDAY th 
          WHERE 1=1
          ${whereOptionString}
          ORDER BY th.HOLIDAY ASC
          LIMIT ${offset}, ${pageLength}
      `,
      {
        replacements: {
          userId: userId,
          aesSecretkey: this.aesSecretkey,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return resultList;
  }

  async getHolidayTotalCount(params: any) {
    let { props, user, transaction, whereOptionString } = params
    let { userId } = user

    let totalCount: any = await this.CommonModel.sequelize.query(
      `
          SELECT COUNT(th.ID) as totalCount 
          FROM TB_HOLIDAY th 
          WHERE 1=1
          ${whereOptionString}
      `,
      {
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return totalCount[0].totalCount;
  }


  async getHolidayLastSyncDtm(params: any) {
    let { props, user, transaction } = params
    let { userId } = user

    let lastSyncDtm: any = await this.CommonModel.sequelize.query(
      `
        SELECT MAX(th.MODIFY_DTM) AS lastSyncDtm
          FROM TB_HOLIDAY th 
         WHERE th.MODIFY_LOGIN_ID = '${this.batchName}'
      `,
      {
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return lastSyncDtm[0].lastSyncDtm;
  }

  /*************************************************
   * 공휴일 BY 해당 날짜
   * 
   * @returns 공휴일 1
   ************************************************/
  async getHolidayByDate(params: any) {
    let { props, user, transaction } = params
    let { userId } = user
    let { holiday } = props

    let result: any = await this.CommonModel.sequelize.query(
      `
          SELECT th.ID 
                ,th.HOLIDAY 
                ,th.HOLIDAY_NAME 
                ,th.CREATE_LOGIN_ID 
                ,th.CREATE_DTM 
                ,th.MODIFY_LOGIN_ID 
                ,th.MODIFY_DTM 
           FROM TB_HOLIDAY th 
          WHERE 1=1
            AND th.HOLIDAY = :holiday
      `,
      {
        replacements: {
          holiday: holiday,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return result[0];
  }
  /*************************************************
   * 공휴일 등록
   * 
   * @param 
   * @returns 공휴일 등록 생성 성공여부
   ************************************************/
  async insertHoliday(params: any) {
    let { transaction, user, props } = params;
    let { holiday, holidayName } = props;
    let { userId } = user

    let createQuery: any = await this.CommonModel.sequelize.query(
      `
        INSERT INTO TB_HOLIDAY (
               HOLIDAY
              ,HOLIDAY_NAME
              ,CREATE_LOGIN_ID, CREATE_DTM, MODIFY_LOGIN_ID, MODIFY_DTM
          ) VALUES ( 
            :holiday
            ,:holidayName
            ,:userId , now() ,:userId ,now() 
          ) 
        `,
      {
        replacements: {
          holiday: holiday,
          holidayName: holidayName,
          userId: userId,
        },
        type: QueryTypes.INSERT, transaction
      },
    );

    return createQuery[0];
  }

  /*************************************************
   * 공휴일 수정
   * 
   * @returns 공휴일 수정
   ************************************************/
  async updateHoliday(params: any) {
    let { props, user, transaction } = params;
    let { userId } = user
    let { id, holiday, holidayName } = props;

    let result: any = await this.CommonModel.sequelize.query(
      `
      UPDATE TB_HOLIDAY 
         SET HOLIDAY = :holiday
            ,HOLIDAY_NAME = :holidayName
            ,MODIFY_DTM  = now()
            ,MODIFY_LOGIN_ID = :userId
      WHERE 1=1
        AND ID = :id
      `,
      {
        replacements: {
          holiday: holiday,
          holidayName: holidayName,
          userId: userId,
          id: id
        },
        type: QueryTypes.UPDATE, transaction,
      },
    );

    return result[0];
  }

  /*************************************************
   * 공휴일 삭제   
   * 
   * @param 
   * @returns 
   ************************************************/
  async deleteHoliday(params: any) {
    let { props, user, transaction } = params;
    let { id, holiday, holidayName } = props;

    await this.CommonModel.sequelize.query(
      `
        DELETE FROM TB_HOLIDAY th
         WHERE 1=1
           AND th.id = :id
      `,
      {
        replacements: {
          id: id
        },
        type: QueryTypes.DELETE, transaction,
        mapToModel: true,
        raw: true
      },
    );
  }
}


