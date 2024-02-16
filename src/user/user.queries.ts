import { Inject, Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import moment from 'moment';
import { randomBytes } from 'crypto';

@Injectable()
export class UserQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON
  ) {}

  private aesSecretkey = process.env['AES_SECRETKEY'];

  /*************************************************
   * 사용자 신청     
   * 
   * @param SignUpDto
   * @returns 유저 PK ID
   ************************************************/
  async insertUser(params: any) {
    let { transaction, props } = params;
    let { userNm, userId, mobileNo, hashPassword, organizationCd
      , department, position, job, officePhoneNo, emailReceiveYn, smsReceiveYn , statusCd 
      , approvalLoginId , approvalDtm , joinRouteTypeCd
    } = props;
    const authCd = 'OP'
    const pwdErrorCount = 0
    
    const encrypt_iv = randomBytes(16).toString('hex').toUpperCase()

    let createUserLoingQuery: any =
      await this.CommonModel.sequelize.query(
        `
        INSERT INTO TB_USER (USER_NM
                  , ORGANIZATION_CD
                  , LOGIN_ID 
                  , LOGIN_PWD 
                  , AUTH_CD 
                  , DEPARTMENT 
                  , POSITION 
                  , JOB 
                  , MOBILE_NO 
                  , OFFICE_PHONE_NO 
                  , EMAIL_RECEIVE_YN 
                  , SMS_RECEIVE_YN 
                  , LAST_LOGIN_DTM 
                  , JOIN_DTM 
                  , JOIN_ROUTE_TYPE_CD
                  , PWD_ERROR_COUNT 
                  , LAST_PWD_CHANGE_DATE 
                  , PRE_LOGIN_PWD 
                  , STATUS_CD  
                  , SIGN_PASSWORD 
                  , DELETE_DTM 
                  , DELETE_REASON_CD 
                  , DELETE_REASON_ETC 
                  , LAST_ORG_CHANGE_DATE 
                  , APPROVAL_LOGIN_ID 
                  , APPROVAL_DTM 
                  , ENCRYPT_IV
                  , CREATE_DTM , CREATE_LOGIN_ID , MODIFY_DTM , MODIFY_LOGIN_ID 
          ) VALUES ( 
                    HEX(AES_ENCRYPT(:userNm, :aesSecretkey, :encrypt_iv))
                  , :organizationCd
                  , :userId 
                  , :hashPassword 
                  , :authCd 
                  , :department 
                  , :position 
                  , :job 
                  , HEX(AES_ENCRYPT(:mobileNo, :aesSecretkey, :encrypt_iv))
                  , HEX(AES_ENCRYPT(:officePhoneNo, :aesSecretkey, :encrypt_iv))
                  , :emailReceiveYn 
                  , :smsReceiveYn 
                  , null 
                  , now() 
                  , :joinRouteTypeCd
                  , :pwdErrorCount
                  , now()  
                  , null 
                  , :statusCd 
                  , null
                  , null 
                  , null 
                  , null 
                  , now()  
                  , :approvalLoginId 
                  , :approvalDtm
                  , :encrypt_iv
                  , now() , :userId , now() , :userId
          ) 
        `,
        {
          replacements: {
            userNm:userNm,
            organizationCd:organizationCd,
            userId:userId,
            hashPassword:hashPassword,
            authCd:authCd,
            department:department,
            position:position,
            job:job,
            mobileNo:mobileNo,
            officePhoneNo:officePhoneNo,
            emailReceiveYn:emailReceiveYn,
            smsReceiveYn:smsReceiveYn,
            pwdErrorCount:pwdErrorCount,
            statusCd:statusCd,
            joinRouteTypeCd: joinRouteTypeCd,
            approvalLoginId:approvalLoginId??null,
            approvalDtm:approvalDtm??null,

            aesSecretkey:this.aesSecretkey,
            encrypt_iv:encrypt_iv
          },
          type: QueryTypes.INSERT , transaction 
        },
      );

    return createUserLoingQuery[0];
  }

  

  /*************************************************
   * 로그인시,  유저 마지막 로그인 시간 업데이트
   * 
   * @param LoginDto
   * @returns 
   ************************************************/
  async updateUserLastLogin(params: any) {
    let { props, transaction } = params;
    let { userId } = props

    let updateUserLoingQuery: any = await this.CommonModel.sequelize.query(
        `
          UPDATE TB_USER tu 
            SET tu.LAST_LOGIN_DTM = now()
              , tu.PWD_ERROR_COUNT = 0
              , tu.MODIFY_DTM = now()
              , tu.MODIFY_LOGIN_ID = :userId
          WHERE 1=1
          AND tu.LOGIN_ID = :userId
        `,
        {
          replacements: {
            userId:userId,
          },
          type: QueryTypes.UPDATE, transaction
        },
      );

    return updateUserLoingQuery[0];
  }

  /*************************************************
   * 로그인시,  유저 로그인 이력 생성
   * 
   * @param LoginDto
   * @returns 
   ************************************************/
  async insertUserLoginHistory(params: any) {
    let { props, transaction } = params;
    let { userId , userAgent , ip } =props

    let createUserLoingQuery: any =
      await this.CommonModel.sequelize.query(
        `
        INSERT INTO TB_USER_LOGIN_HIST (
              LOGIN_ID
              , LOGIN_DTM 
              , USER_AGENT 
              , LOGIN_IP 
              , CREATE_DTM , CREATE_LOGIN_ID , MODIFY_DTM , MODIFY_LOGIN_ID 
                  )
          VALUES (
              :userId
              , now()
              , :userAgent
              , :ip
              , now() , :userId , now() , :userId 
          ) 
        `,
        {
          replacements: {
            userId:userId,
            userAgent:userAgent,
            ip:ip
          },
          type: QueryTypes.INSERT, transaction 
        },
      );

    return createUserLoingQuery[0];
  }

  /*************************************************
   * 비밀번호 에러 카운트 
   * -> 비밀번호 변경, 로그인
   * 
   * @param {String} userId 
   * @returns 
   ************************************************/
  async updatePwdErrorCount(params: any) {
    let { props, transaction } = params;
    let { userId } = props
    let pwdErrorUpdateQuery: any = await this.CommonModel.sequelize.query(
        `
          UPDATE TB_USER tu 
          SET tu.PWD_ERROR_COUNT = tu.PWD_ERROR_COUNT + 1
          WHERE 1=1
          AND tu.LOGIN_ID = :userId
        `,
        {
          replacements: {
            userId:userId,
          },
          type: QueryTypes.UPDATE, transaction
        },
    )

    return pwdErrorUpdateQuery[0];
  }

  /*************************************************
     * 비밀번호 변경 권고 날짜 변경  
     * -> 비밀번호 변경 권고일 변경
     * 
     * @param {String} userId           사용자 아이디
     * @param {String} pwdResetYn       비밀번호 리셋 여부    
     * @returns 
     ************************************************/
  async updateLastPwChgDate(params: any) {
    let {userId , transaction} = params
    let updatePwdData : any = await this.CommonModel.sequelize.query(
      `
      UPDATE  TB_USER
         SET  LAST_PWD_CHANGE_DATE = now()
             ,MODIFY_LOGIN_ID = :userId
             ,MODIFY_DTM = now()
       WHERE  1=1
         AND  LOGIN_ID = :userId
      `
      ,
      {
        replacements: {
          userId:userId,
        },
        type: QueryTypes.UPDATE , transaction 
      },
    );
    return updatePwdData;
  }

  
  /*************************************************
   * 사용자 암호 변경  
   * -> 비밀번호 리셋 / 비밀번호 변경
   * 
   * @param {String} userId           사용자 아이디
   * @param {String} dbPw             이전 비밀번호
   * @param {String} pwdResetYn       비밀번호 리셋 여부
   * @param {String} nowPasswordCheck 변경 비밀번호
   * @param {String} modifyUserId     
   * @returns 
   ************************************************/
  async updateUserPwd(params: any) {
    let {userId , dbPw , pwdResetYn, nowPasswordCheck , modifyUserId , transaction} = params
    let updateData: any = await this.CommonModel.sequelize.query(
      ` 
      UPDATE TB_USER 
        SET LOGIN_PWD = :nowPasswordCheck
          , PRE_LOGIN_PWD = :dbPw
          , LAST_PWD_CHANGE_DATE = now()
          , PWD_ERROR_COUNT = 0
          , MODIFY_DTM = now()
          , MODIFY_LOGIN_ID = :modifyUserId
        WHERE 1=1
        AND LOGIN_ID = :userId
      `,
      {
        replacements: {
          userId:userId,
          dbPw:dbPw,
          pwdResetYn:pwdResetYn,
          modifyUserId:modifyUserId,
          nowPasswordCheck:nowPasswordCheck,
        },
        type: QueryTypes.UPDATE , transaction
      },
    );

    return updateData;
  }

  /*************************************************
   * 사용자 간편비밀번호 변경
   * 
   * @param {String} signPassword           간편비밀번호
   * @returns 
   ************************************************/
  async updateUserSignPassword(params: any) {
    let { props , user , transaction } = params;
    let { signPassword } = props 
    let { userId } = user
    let updateData: any = await this.CommonModel.sequelize.query(
      ` 
      UPDATE TB_USER 
        SET SIGN_PASSWORD = HEX(AES_ENCRYPT(:signPassword, :aesSecretkey, ENCRYPT_IV))
          , MODIFY_DTM = now()
          , MODIFY_LOGIN_ID = :userId
        WHERE 1=1
        AND LOGIN_ID = :userId
      `,
      {
        replacements: {
          userId:userId,
          signPassword:signPassword,
          aesSecretkey:this.aesSecretkey,
        },
        type: QueryTypes.UPDATE , transaction
      },
    );

    return updateData;
  }

  /*************************************************
   * 기관 정보 조회
   * 
   * @returns 전체 기관 정보 
   ************************************************/
  async getOrganizationUsers(params : any) {
    let { offset, pageLength, whereOptionString, orderOptionString, transaction } = params;
    const resultList: any = await this.CommonModel.sequelize.query(
        `
          SELECT tu.ID 
                ,CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS USER_NM 
                ,tu.ORGANIZATION_CD 
                ,tu.LOGIN_ID 
                ,tu.AUTH_CD 
                ,tu.DEPARTMENT 
                ,tu.POSITION 
                ,tu.JOB 
                ,CAST(AES_DECRYPT(UNHEX(tu.MOBILE_NO), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS MOBILE_NO 
                ,tu.LAST_LOGIN_DTM 
                ,tu.JOIN_DTM 
                ,tu.DELETE_DTM 
                ,tu.DELETE_REASON_CD 
                ,tu.DELETE_REASON_ETC 
                ,tu.LAST_ORG_CHANGE_DATE 
                ,tu.APPROVAL_LOGIN_ID 
                ,tu.APPROVAL_DTM 
                ,tu.STATUS_CD 
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tu.STATUS_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'USER_STATUS') AS STATUS_CD_NM
            FROM TB_USER tu
           WHERE 1=1
             AND tu.STATUS_CD = 'APPROVAL'
            ${whereOptionString}
            ${orderOptionString}
          LIMIT ${offset}, ${pageLength}
        `,  
        { 
          replacements: {
            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT, transaction,
          mapToModel: true,
        },
      );

    return resultList;
  }
 
  async getOrganizationUsersTotalCount(params :any) {
    let { whereOptionString , transaction} = params;
    let totalCount: any = await this.CommonModel.sequelize.query(
        `
          SELECT COUNT(tu.ID) as totalCount
          FROM TB_USER tu
          WHERE 1=1
            AND tu.STATUS_CD = 'APPROVAL'
            ${whereOptionString}
      `,
        { type: QueryTypes.SELECT,transaction },
      );

    return totalCount[0].totalCount;
  } 

  /*************************************************
   * 사용자 서명 조회 - 마이페이지
   * 
   * @param 
   * @returns 사용자 서명 조회
   ************************************************/
  async getUserSign(params : any) {
    let { props , user , transaction } = params
    let { userId } = user;

    const result: any = await this.CommonModel.sequelize.query(
        `
          SELECT tus.ID 
                ,tus.LOGIN_ID 
                ,tus.SIGN_REG_TYPE_CD 
                ,tus.ORIGINAL_FILE_NM 
                ,tus.SAVE_FILE_NM 
                ,tus.FILE_PATH 
                ,CAST(AES_DECRYPT(UNHEX(tu.SIGN_PASSWORD), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS SIGN_PASSWORD 
                ,tus.DELETE_YN 
                ,tus.MODIFY_DTM 
           FROM TB_USER_SIGN tus
          INNER JOIN TB_USER tu ON tu.LOGIN_ID = tus.LOGIN_ID 
          WHERE 1=1
            AND tus.LOGIN_ID = :userId
            AND tus.DELETE_YN = 'N'
        `,  
        { 
          replacements : {
            userId:userId,
            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT, transaction,
          mapToModel: true,
        },
      );

    return result[0];
  }


  /*************************************************
   * 사용자 서명 등록/업데이트
   * 
   * @param 
   * @returns  사용자 서명 등록/업데이트
   ************************************************/
  async insertUserSign(params: any) {
    let { fileInfo, props , user , transaction } = params;
    let { signRegTypeCd ,files
    } = props
    let {userId} = user
    
    const filePath = fileInfo.filePath
    const originalFileNm = fileInfo.originalFileNm
    const saveFileNm = fileInfo.saveFileNm
    

    const result: any = await this.CommonModel.sequelize.query(
      `
        INSERT INTO TB_USER_SIGN ( 
                    LOGIN_ID 
                    ,SIGN_REG_TYPE_CD 
                    ,ORIGINAL_FILE_NM 
                    ,SAVE_FILE_NM 
                    ,FILE_PATH 
                    ,DELETE_YN 
                    ,CREATE_DTM , CREATE_LOGIN_ID , MODIFY_DTM , MODIFY_LOGIN_ID 
          ) VALUES ( 
                    :userId
                    ,:signRegTypeCd
                    ,:originalFileNm 
                    ,:saveFileNm  
                    ,:filePath 
                    ,'N'
                    ,now(), :userId, now(), :userId
          ) ON DUPLICATE KEY UPDATE
               LOGIN_ID = :userId
               ,SIGN_REG_TYPE_CD = :signRegTypeCd
               ,ORIGINAL_FILE_NM = :originalFileNm
               ,SAVE_FILE_NM = :saveFileNm
               ,FILE_PATH = :filePath
               ,DELETE_YN = 'N'
               ,MODIFY_DTM = now()
               ,MODIFY_LOGIN_ID = :userId
      `,  
      { 
        replacements: {
          signRegTypeCd:signRegTypeCd,
          originalFileNm:originalFileNm,
          saveFileNm:saveFileNm,
          filePath:filePath,
          userId:userId
        },
        type: QueryTypes.INSERT, transaction,
        mapToModel: true,
      },
    );

    return result[0];
  }

  /*************************************************
   * 사용자 서명 삭제
   * 
   * @param 
   * @returns 사용자 서명 삭제
 ************************************************/
  async deleteUserSign(params :any) {
    let { props ,user , transaction } = params
    let { userId } = user
    await this.CommonModel.sequelize.query(
      `
        UPDATE TB_USER_SIGN 
        SET DELETE_YN = :deleteYn
          , MODIFY_DTM = now()
          , MODIFY_LOGIN_ID = :modifyUserId
        WHERE 1=1
        AND LOGIN_ID = :userId
      `,
      {
        replacements: {
          userId:userId,
          modifyUserId:userId,
          deleteYn:'Y'
        },
        type: QueryTypes.UPDATE , transaction
      },
    );
  }


  /**********************[사용자 관리]***********************/
  /*************************************************
   * 사용자 리스트   
   * 
   * @param 
   * @returns 사용자 리스트
   ************************************************/
  async getUesrList(params :any) {
    let { transaction
      , offset, pageLength
      , whereOptionString, orderOptionString 
      } = params;
     const resultList: any = await this.CommonModel.sequelize.query(
         `
         SELECT * 
            FROM (
              SELECT tu.ID 
                    ,CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS USER_NM 
                    ,tu.ORGANIZATION_CD 
                    ,tog.ORGANIZATION_NM 
                    ,tog.ORGANIZATION_TYPE_CD 
                    ,tu.LOGIN_ID 
                    ,tu.AUTH_CD 
                    ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tu.AUTH_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'USER_AUTH') AS AUTh_CD_NM
                    ,tu.DEPARTMENT 
                    ,tu.POSITION
                    ,tu.JOB 
                    ,CAST(AES_DECRYPT(UNHEX(tu.MOBILE_NO), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS MOBILE_NO 
                    ,CAST(AES_DECRYPT(UNHEX(tu.OFFICE_PHONE_NO), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS OFFICE_PHONE_NO 
                    ,tu.EMAIL_RECEIVE_YN 
                    ,tu.SMS_RECEIVE_YN 
                    ,tu.LAST_LOGIN_DTM 
                    ,tu.JOIN_DTM 
                    ,tu.JOIN_ROUTE_TYPE_CD
                    ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tu.JOIN_ROUTE_TYPE_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'JOIN_ROUTE_TYPE') AS JOIN_ROUTE_TYPE_CD_NM
                    ,tu.PWD_ERROR_COUNT 
                    ,tu.LAST_PWD_CHANGE_DATE 
                    ,tu.STATUS_CD 
                    ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tu.STATUS_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'USER_STATUS') AS STATUS_CD_NM
                    ,CAST(AES_DECRYPT(UNHEX(tu.SIGN_PASSWORD), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS SIGN_PASSWORD 
                    ,tu.DELETE_DTM 
                    ,tu.DELETE_REASON_CD 
                    ,tu.DELETE_REASON_ETC 
                    ,tu.LAST_ORG_CHANGE_DATE 
                    ,tu.APPROVAL_LOGIN_ID 
                    ,tu.APPROVAL_DTM 
                    ,tu.ENCRYPT_IV
                    ,tu.CREATE_LOGIN_ID 
                    ,tu.CREATE_DTM 
                    ,tu.MODIFY_LOGIN_ID 
                    ,tu.MODIFY_DTM 
              FROM TB_USER tu 
              JOIN TB_ORGANIZATION tog ON tog.ORGANIZATION_CD = tu.ORGANIZATION_CD 
              WHERE 1=1
                -- AND tu.AUTH_CD != 'SM'
           ) tu 
           WHERE 1=1 
          ${whereOptionString}
          ${orderOptionString}
          LIMIT ${offset}, ${pageLength}
         `,  
         { 
          replacements: {
            aesSecretkey:this.aesSecretkey,
          },
           type: QueryTypes.SELECT, transaction,
           mapToModel: true,
         },
     );
     return resultList;
   }

   /*************************************************
   * 사용자 토탈 카운트
   * 
   * @param 
   * @returns 사용자 토탈 카운트
   ************************************************/
   async getUesrTotalCount(params :any) {
    let { transaction 
      , whereOptionString 
    } = params;
    let userTotalCount: any = await this.CommonModel.sequelize.query(
        `
        SELECT COUNT(tu.ID) as totalCount 
          FROM (
            SELECT tu.ID 
                  ,CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS USER_NM 
                  ,tu.ORGANIZATION_CD 
                  ,tog.ORGANIZATION_NM 
                  ,tog.ORGANIZATION_TYPE_CD 
                  ,tu.LOGIN_ID 
                  ,tu.AUTH_CD 
                  ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tu.AUTH_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'USER_AUTH') AS AUTh_CD_NM
                  ,tu.DEPARTMENT 
                  ,tu.POSITION
                  ,tu.JOB 
                  ,CAST(AES_DECRYPT(UNHEX(tu.MOBILE_NO), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS MOBILE_NO 
                  ,CAST(AES_DECRYPT(UNHEX(tu.OFFICE_PHONE_NO), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS OFFICE_PHONE_NO 
                  ,tu.EMAIL_RECEIVE_YN 
                  ,tu.SMS_RECEIVE_YN 
                  ,tu.LAST_LOGIN_DTM 
                  ,tu.JOIN_DTM 
                  ,tu.JOIN_ROUTE_TYPE_CD
                  ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tu.JOIN_ROUTE_TYPE_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'JOIN_ROUTE_TYPE') AS JOIN_ROUTE_TYPE_CD_NM
                  ,tu.PWD_ERROR_COUNT 
                  ,tu.LAST_PWD_CHANGE_DATE 
                  ,tu.STATUS_CD 
                  ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tu.STATUS_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'USER_STATUS') AS STATUS_CD_NM
                  ,CAST(AES_DECRYPT(UNHEX(tu.SIGN_PASSWORD), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS SIGN_PASSWORD 
                  ,tu.DELETE_DTM 
                  ,tu.DELETE_REASON_CD 
                  ,tu.DELETE_REASON_ETC 
                  ,tu.LAST_ORG_CHANGE_DATE 
                  ,tu.APPROVAL_LOGIN_ID 
                  ,tu.APPROVAL_DTM 
                  ,tu.ENCRYPT_IV
                  ,tu.CREATE_LOGIN_ID 
                  ,tu.CREATE_DTM 
                  ,tu.MODIFY_LOGIN_ID 
                  ,tu.MODIFY_DTM 
              FROM TB_USER tu 
              JOIN TB_ORGANIZATION tog ON tog.ORGANIZATION_CD = tu.ORGANIZATION_CD 
              WHERE 1=1
                -- AND tu.AUTH_CD != 'SM'
          ) tu
        WHERE 1=1
        ${whereOptionString}
      `,
        { 
          replacements: {
            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT , transaction 
        },
      );

    return userTotalCount[0].totalCount;
   }

   /*************************************************
   * 사용자 상태 변경
   * 
   * @param 
   * @returns 사용자 상태 변경 성공여부
   ************************************************/
  async updateUserStatus(params :any) {
    let { props , user , transaction } = params
    let { userId ,  statusCd , rejectReasonCd , rejectReasonEtc } = props;

    const modifyUserId = user?.userId

    let updateString = '';
    if(statusCd == 'APPROVAL'){
      updateString += `, APPROVAL_LOGIN_ID = '${modifyUserId}' , APPROVAL_DTM = now()`
    }
    if(statusCd == 'REJECT'){
      updateString += `
        , REJECT_LOGIN_ID = '${modifyUserId}' 
        , REJECT_REASON_CD = '${rejectReasonCd}'
        , REJECT_REASON_ETC = '${rejectReasonEtc}'
        , REJECT_DTM = now()
      `
    }

    await this.CommonModel.sequelize.query(
      `
        UPDATE TB_USER 
        SET STATUS_CD = :statusCd
          , MODIFY_DTM = now()
          , MODIFY_LOGIN_ID = :modifyUserId
          ${updateString}
        WHERE 1=1
        AND LOGIN_ID = :userId
      `,
      {
        replacements: {
          userId:userId,
          modifyUserId:modifyUserId,
          statusCd:statusCd
        },
        type: QueryTypes.UPDATE , transaction
      },
    );
  }

   /*************************************************
   * 사용자 로그인 내역 리스트  
   * 
   * @param 
   * @returns 사용자 로그인 내역 리스트
   ************************************************/
  async getUesrLoginHistory(params :any) {
    let { transaction
    , offset, pageLength
    , whereOptionString, orderOptionString } = params;
    const resultList: any = await this.CommonModel.sequelize.query(
        `
        SELECT tulh.ID 
          , tulh.LOGIN_ID 
          , tulh.LOGIN_DTM 
          , tulh.USER_AGENT 
          , tulh.LOGIN_IP 
          , tulh.CREATE_DTM 
        FROM TB_USER_LOGIN_HIST tulh 
        WHERE 1=1
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

  /*************************************************
   * 사용자 로그인 내역 토탈 카운트
   * 
   * @param 
   * @returns 토탈 카운트
   ************************************************/
   async getUesrLoginHistoryTotalCount(params :any) {
    let { transaction , whereOptionString } = params;
    let userTotalCount: any = await this.CommonModel.sequelize.query(
        `
        SELECT COUNT(tulh.ID) as totalCount
        FROM TB_USER_LOGIN_HIST tulh 
        WHERE 1=1
          ${whereOptionString}
      `,
        { type: QueryTypes.SELECT , transaction },
      );

    return userTotalCount[0].totalCount;
   }
  /*************************************************
   * 관리포탈 - 회원 관리 (권한수정)
   * 
   * @param 
   * @returns 관리포탈 - 회원 관리 (권한수정)
   ************************************************/
  async updateUserAuth(params: any) {
    let { props , user , transaction} = params
    let { loginId , authCd } = props
    const modifyUserId = user.userId
    let updateData: any = await this.CommonModel.sequelize.query(
      ` 
        UPDATE TB_USER 
          SET AUTH_CD = :authCd
              ,MODIFY_DTM = now()
              ,MODIFY_LOGIN_ID = :modifyUserId
        WHERE 1=1
          AND LOGIN_ID = :loginId
      `,
      {
        replacements: {
          loginId:loginId,
          authCd:authCd,
          modifyUserId:modifyUserId,
        },
        type: QueryTypes.UPDATE , transaction
      },
    );

    return updateData;
  }

  /*************************************************
   * 관리포탈 - 회원 관리 (수정)
   * 
   * @param 
   * @returns 관리포탈 - 회원 관리
   ************************************************/
  async updateUserInfo(params: any) {
    let { props , user , transaction} = params
    let { userNm , loginId , userPwd , userPwdChk 
      ,  mobileNo , department , position , job , officePhoneNo 
      , smsReceiveYn , emailReceiveYn
    } = props
    const modifyUserId = user.userId
    let updateData: any = await this.CommonModel.sequelize.query(
      ` 
      UPDATE TB_USER 
        SET USER_NM = HEX(AES_ENCRYPT(:userNm, :aesSecretkey, ENCRYPT_IV))
           ,MOBILE_NO = HEX(AES_ENCRYPT(:mobileNo, :aesSecretkey, ENCRYPT_IV))
           ,DEPARTMENT = :department
           ,POSITION = :position
           ,JOB = :job
           ,OFFICE_PHONE_NO = HEX(AES_ENCRYPT(:officePhoneNo, :aesSecretkey, ENCRYPT_IV))
           ,EMAIL_RECEIVE_YN = :emailReceiveYn
           ,SMS_RECEIVE_YN = :smsReceiveYn
           ,MODIFY_DTM = now()
           ,MODIFY_LOGIN_ID = :modifyUserId
        WHERE 1=1
        AND LOGIN_ID = :loginId
      `,
      {
        replacements: {
          loginId:loginId,
          userNm:userNm,
          mobileNo:mobileNo,
          
          department:department,
          position:position,
          job:job,
          officePhoneNo:officePhoneNo,
          
          smsReceiveYn:smsReceiveYn,
          emailReceiveYn:emailReceiveYn,

          modifyUserId:modifyUserId,

          aesSecretkey:this.aesSecretkey,
        },
        type: QueryTypes.UPDATE , transaction
      },
    );

    return updateData;
  }
   /*************************************************
   * 관리포탈 - 회원 관리 (수정)
   * 
   * @param 
   * @returns 관리포탈 - 회원 관리
   ************************************************/
   async updateParticipantInfo(params: any) {
    const { props , user , transaction} = params
    const { userNm , loginId } = props
    const updateData: any = await this.CommonModel.sequelize.query(
      ` 
      UPDATE TB_PROJECT_PARTICIPANT 
        SET PARTICIPANT_NM = :userNm
        WHERE 1=1
        AND PARTICIPANT_LOGIN_ID = :loginId
      `,
      {
        replacements: {
          loginId,
          userNm,
        },
        type: QueryTypes.UPDATE , transaction
      },
    );

    return updateData;
  }
  /*************************************************
   * 관리포탈 - 회원 탈퇴 전 SPONSER 여부
   * 
   * @param 
   * @returns 관리포탈 - 탈퇴 전 SPONSER 여부
   ************************************************/
  async sponserYn(params: any) {
    let { props , user , transaction} = params
    let {userId} = user
    let sponserYnData: any = await this.CommonModel.sequelize.query(
      `
      SELECT *
        FROM ( 
              SELECT tp.PROTOCOL_NO 
                    ,(SELECT COUNT(*)
                        FROM TB_PROJECT_PARTICIPANT tpp2 
                       INNER JOIN TB_PROJECT_ORGANIZATION tpo2
                          ON tpp2.PROTOCOL_NO = tpo2.PROTOCOL_NO 
                         AND tpp2.ORGANIZATION_CD = tpo2.ORGANIZATION_CD 
                         AND tpo2.DELETE_YN ='N'
                       WHERE tpp2.PROTOCOL_NO = tp.PROTOCOL_NO 
                         AND tpp2.PARTICIPANT_LOGIN_ID  <> :userId
                         AND tpp2.ROLE_CD  = 'SPONSOR'
                         AND tpp2.DELETE_YN = 'N'
                    ) AS SPON_COUNT
                FROM TB_PROJECT tp 
               INNER JOIN TB_PROJECT_ORGANIZATION tpo 
                  ON tp.PROTOCOL_NO = tpo.PROTOCOL_NO 
                 AND tpo.DELETE_YN ='N'
               INNER JOIN TB_PROJECT_PARTICIPANT tpp 
                  ON tpo.PROTOCOL_NO = tpp.PROTOCOL_NO 
                 AND tpo.ORGANIZATION_CD = tpp.ORGANIZATION_CD 
                 AND tpp.PARTICIPANT_LOGIN_ID  = :userId
                 AND tpp.ROLE_CD  = 'SPONSOR'
                 AND tpp.DELETE_YN = 'N'
               WHERE 1=1
                 AND tp.DELETE_YN = 'N'
                 AND tp.TRIAL_CLOSE_YN = 'N'
                 AND tp.STATUS_CD ='COMPLETE'
                 AND tp.TRIAL_END_DATE >= DATE_FORMAT(NOW(), '%Y-%m-%d')
        ) AS t1
        WHERE t1.SPON_COUNT  = 0
      `,
      { 
        replacements: {
          userId:userId,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
  );
  return sponserYnData

  }

  /*************************************************
   * 관리포탈 - 회원 탈퇴 전 임상진행중 프로젝트 여부
   * 
   * @param 
   * @returns 관리포탈 - 탈퇴 전 임상진행중 프로젝트 여부
   ************************************************/
  async clinicalYn(params: any) {
    let { props , user , transaction} = params
    let {userId} = user
    let clinicalYnData: any = await this.CommonModel.sequelize.query(
      `
      SELECT tp.PROTOCOL_NO 
        FROM TB_PROJECT tp 
       INNER JOIN TB_PROJECT_ORGANIZATION tpo 
          ON tp.PROTOCOL_NO = tpo.PROTOCOL_NO 
         AND tpo.DELETE_YN ='N'
       INNER JOIN TB_PROJECT_PARTICIPANT tpp 
          ON tp.PROTOCOL_NO = tpp.PROTOCOL_NO 
         AND tpp.PARTICIPANT_LOGIN_ID  = :userId
         AND tpp.ROLE_CD  <> 'SPONSOR'
         AND tpp.DELETE_YN = 'N'
       WHERE 1=1
         AND tp.DELETE_YN = 'N'
         AND tp.TRIAL_CLOSE_YN = 'N'
         AND tp.STATUS_CD ='COMPLETE'
         AND tp.TRIAL_END_DATE >= DATE_FORMAT(NOW(), '%Y-%m-%d')
      `,
      { 
        replacements: {
          userId:userId,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
  );
  return clinicalYnData

  }


  /*************************************************
   * 관리포탈 - 회원 탈퇴 
   * 
   * @param 
   * @returns 관리포탈 - 회원 탈퇴
   ************************************************/
  async deleteUser(params: any) {
    let { props , user , transaction } = params
    let {userId} = user
    let { deleteReasonCd , deleteReasonEtc } = props
    let deleteData :any = await this.CommonModel.sequelize.query(
      `
        UPDATE TB_USER 
           SET STATUS_CD = 'DELETE'
              ,DELETE_DTM = now()
              ,DELETE_REASON_CD = :deleteReasonCd
              ,DELETE_REASON_ETC = :deleteReasonEtc
         WHERE 1=1
           AND LOGIN_ID = :userId
      `,
      {
        replacements: {
          userId: userId,
          deleteReasonCd: deleteReasonCd,
          deleteReasonEtc: deleteReasonEtc || null
        },
        type: QueryTypes.UPDATE , transaction
      },

    );

    return deleteData
  }
}
