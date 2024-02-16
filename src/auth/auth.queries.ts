import { Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class AuthQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON,
  ) {}

  private aesSecretkey = process.env['AES_SECRETKEY'];

  /*************************************************
   * 사용자 정보 조회   
   * 
   * @param {String} userId  사용자 아이디
   * @returns 사용자 정보
   ************************************************/
  async userInfo(params: any) {
    let { transaction, props } = params;
    let { userId } = props;
    const userInfo: any = await this.CommonModel.sequelize.query(
        `
          SELECT tu.ID 
                ,CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS USER_NM 
                ,tu.ORGANIZATION_CD
                ,tog.ORGANIZATION_NM 
                ,tu.LOGIN_ID 
                ,tu.LOGIN_PWD 
                ,tu.AUTH_CD 
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tu.AUTH_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'USER_AUTH') AS AUTH_CD_NM
                ,tu.DEPARTMENT 
                ,tu.POSITION 
                ,tu.JOB 
                ,CAST(AES_DECRYPT(UNHEX(tu.MOBILE_NO), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS MOBILE_NO 
                ,CAST(AES_DECRYPT(UNHEX(tu.OFFICE_PHONE_NO), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS OFFICE_PHONE_NO 
                ,tu.EMAIL_RECEIVE_YN 
                ,tu.SMS_RECEIVE_YN 
                ,tu.LAST_LOGIN_DTM 
                ,tu.JOIN_DTM 
                ,tu.PWD_ERROR_COUNT 
                ,tu.LAST_PWD_CHANGE_DATE 
                ,tu.PRE_LOGIN_PWD 
                ,tu.STATUS_CD 
                ,CAST(AES_DECRYPT(UNHEX(tu.SIGN_PASSWORD), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS SIGN_PASSWORD 
                ,tu.DELETE_DTM 
                ,tu.DELETE_REASON_CD 
                ,tu.DELETE_REASON_ETC 
                ,tu.LAST_ORG_CHANGE_DATE 
                ,tu.APPROVAL_LOGIN_ID 
                ,tu.APPROVAL_DTM
                ,tu.REJECT_LOGIN_ID 
                ,tu.REJECT_DTM 
                ,tu.REJECT_REASON_CD 
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tu.REJECT_REASON_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'USER_REJECT_REASON') AS REJECT_REASON_CD_NM
                ,tu.REJECT_REASON_ETC 
                ,TIMESTAMPDIFF(MONTH, tu.LAST_PWD_CHANGE_DATE, now()) AS PWD_MONTH_DIFF
            FROM TB_USER tu 
            JOIN TB_ORGANIZATION tog ON tog.ORGANIZATION_CD = tu.ORGANIZATION_CD
           WHERE 1=1
             AND tu.LOGIN_ID = :userId
        `,
        { 
          replacements: {
            userId:userId,
            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT, transaction ,
          mapToModel: true,
        },
      );

    return userInfo[0];
  }
  /*************************************************
   * 프로젝트 등록 여부 검사   
   * 
   * @param {String} email  사용자 아이디
   * @returns 사용자 정보
   ************************************************/
  async participantEmail(params: any) {
    let { transaction, props } = params;
    let { userId } = props;
    const participant: any = await this.CommonModel.sequelize.query(
        `
          SELECT tpp.ID 
            FROM TB_PROJECT_PARTICIPANT tpp
            JOIN TB_ORGANIZATION tog ON tog.DELETE_YN='N'
                      AND tog.ORGANIZATION_CD = tpp.ORGANIZATION_CD
            JOIN TB_PROJECT tp ON tp.DELETE_YN='N'
                      AND tp.PROTOCOL_NO = tpp.PROTOCOL_NO
           WHERE 1=1
             AND tpp.DELETE_YN='N'
             AND tpp.PARTICIPANT_EMAIL = :userId
        `,
        { 
          replacements: {
            userId
          },
          type: QueryTypes.SELECT, transaction ,
          mapToModel: true,
        },
      );

    return participant[0];
  }

  /*************************************************
   * 사용자 정보 조회 by 사용자 휴대폰 번호
   * 
   * @param {String} mobileNo  사용자 휴대폰 번호
   * @returns 사용자 정보
   ************************************************/
  async userInfoByMobileNo(params: any) {
    let { transaction, props } = params;
    let { mobileNo } = props;
    const userInfo: any = await this.CommonModel.sequelize.query(
        `
        SELECT tu.ID 
              ,CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS USER_NM 
              ,tu.ORGANIZATION_CD
              ,tog.ORGANIZATION_NM 
              ,tu.LOGIN_ID 
              ,tu.LOGIN_PWD 
              ,tu.AUTH_CD 
              ,tu.DEPARTMENT 
              ,tu.POSITION 
              ,tu.JOB 
              ,CAST(AES_DECRYPT(UNHEX(tu.MOBILE_NO), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS MOBILE_NO 
              ,CAST(AES_DECRYPT(UNHEX(tu.OFFICE_PHONE_NO), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS OFFICE_PHONE_NO 
              ,tu.EMAIL_RECEIVE_YN 
              ,tu.SMS_RECEIVE_YN 
              ,tu.LAST_LOGIN_DTM 
              ,tu.JOIN_DTM 
              ,tu.PWD_ERROR_COUNT 
              ,tu.LAST_PWD_CHANGE_DATE 
              ,tu.PRE_LOGIN_PWD 
              ,tu.STATUS_CD 
              ,CAST(AES_DECRYPT(UNHEX(tu.SIGN_PASSWORD), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS SIGN_PASSWORD 
              ,tu.DELETE_DTM 
              ,tu.DELETE_REASON_CD 
              ,tu.DELETE_REASON_ETC 
              ,tu.LAST_ORG_CHANGE_DATE 
              ,tu.APPROVAL_LOGIN_ID 
              ,tu.APPROVAL_DTM 
              ,tu.REJECT_LOGIN_ID 
              ,tu.REJECT_DTM 
              ,tu.REJECT_REASON_CD 
              ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tu.REJECT_REASON_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'USER_REJECT_REASON') AS REJECT_REASON_CD_NM
              ,tu.REJECT_REASON_ETC
              ,TIMESTAMPDIFF(MONTH, tu.LAST_PWD_CHANGE_DATE, now()) AS PWD_MONTH_DIFF
         FROM TB_USER tu 
         JOIN TB_ORGANIZATION tog ON tog.ORGANIZATION_CD = tu.ORGANIZATION_CD
        WHERE 1=1
          AND CAST(AES_DECRYPT(UNHEX(tu.MOBILE_NO), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) = :mobileNo
        `,
        { 
          replacements: {
            mobileNo:mobileNo,
            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT, transaction ,
          mapToModel: true,
        },
      );

    return userInfo[0];
  }

  /*************************************************
   * 사용자 정보 조회 by id
   * 
   * @returns 사용자 정보
   ************************************************/
  async getUserInfoById(params: any) {
    let { transaction, props } = params;
    let { whereStrOptions } = props;
    const userInfo: any = await this.CommonModel.sequelize.query(
        `
        SELECT tu.ID 
              ,CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS USER_NM 
              ,tu.ORGANIZATION_CD
              ,tog.ORGANIZATION_NM 
              ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tog.ORGANIZATION_TYPE_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'ORGANIZATION_TYPE') AS ORGANIZATION_TYPE_NM
              ,tu.LOGIN_ID 
              ,tu.AUTH_CD 
              ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tu.AUTH_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'USER_AUTH') AS AUTH_CD_NM
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
              ,(SELECT CAST(AES_DECRYPT(UNHEX(tu2.USER_NM), :aesSecretkey, tu2.ENCRYPT_IV) AS CHAR) FROM TB_USER tu2 WHERE tu2.LOGIN_ID = tu.APPROVAL_LOGIN_ID) AS APPROVAL_USER_NM
              ,tu.APPROVAL_DTM 
              ,tu.REJECT_LOGIN_ID 
              ,(SELECT CAST(AES_DECRYPT(UNHEX(tu2.USER_NM), :aesSecretkey, tu2.ENCRYPT_IV) AS CHAR) FROM TB_USER tu2 WHERE tu2.LOGIN_ID = tu.REJECT_LOGIN_ID) AS REJECT_USER_NM
              ,tu.REJECT_DTM 
              ,tu.REJECT_REASON_CD 
              ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tu.REJECT_REASON_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'USER_REJECT_REASON') AS REJECT_REASON_CD_NM
              ,tu.REJECT_REASON_ETC  
              ,TIMESTAMPDIFF(MONTH, tu.LAST_PWD_CHANGE_DATE, now()) AS PWD_MONTH_DIFF
              ,tu.CREATE_LOGIN_ID 
              ,tu.CREATE_DTM 
              ,tu.MODIFY_LOGIN_ID 
              ,(SELECT CAST(AES_DECRYPT(UNHEX(tu3.USER_NM), :aesSecretkey, tu3.ENCRYPT_IV) AS CHAR) FROM TB_USER tu3 WHERE tu3.LOGIN_ID = tu.MODIFY_LOGIN_ID) AS MODIFY_USER_NM
              ,tu.MODIFY_DTM
         FROM TB_USER tu 
         JOIN TB_ORGANIZATION tog ON tog.ORGANIZATION_CD = tu.ORGANIZATION_CD
        WHERE 1=1
        ${whereStrOptions}
        `,
        { 
          replacements: {
            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT, transaction ,
          mapToModel: true,
        },
      );

    return userInfo[0];
  }
  
  /*************************************************
   * 인증번호 저장
   * 
   * @param {String} certifyKey  휴대폰번호 또는 이메일주소
   * @param {String} certifyCd  인증번호
   * @returns null
   ************************************************/
  async insertCertifyCd(params: any) {
    let { transaction, props } = params;
    let { certifyKey,  certifyCd, certifyType} = props;
    await this.CommonModel.sequelize.query(
        `
        INSERT INTO TB_CERTIFY_CD
        (      CERTIFY_KEY
              ,CERTIFY_CD
              ,CREATE_DTM
              ,CERTIFY_YN
              ,CERTIFY_TYPE
        )
        VALUES
        (      :certifyKey
              ,:certifyCd
              ,CURRENT_TIMESTAMP
              ,'N'
              ,:certifyType
        )
            ON DUPLICATE KEY UPDATE
               CERTIFY_CD = :certifyCd
              ,CREATE_DTM = CURRENT_TIMESTAMP
              ,CERTIFY_YN = 'N'
        `,
        { 
          replacements: {
            certifyKey:certifyKey,
            certifyCd:certifyCd,
            certifyType:certifyType,
          },
          type: QueryTypes.INSERT, transaction ,
          mapToModel: true,
        },
      );

  }

  /*************************************************
   * 인증번호 조회
   * 
   * @param {String} certifyKey  휴대폰번호 또는 이메일주소
   * @param {String} certifyCd  인증번호
   * @returns 사용자 정보
   ************************************************/
  async getCertifyCd(params: any) {
    let { transaction, props } = params;
    let { certifyKey,  certifyCd} = props;
    const certifyInfo: any = await this.CommonModel.sequelize.query(
        `
        SELECT CERTIFY_KEY
              ,CERTIFY_CD
              ,CREATE_DTM
              ,CERTIFY_YN
          FROM TB_CERTIFY_CD
         WHERE CERTIFY_KEY = :certifyKey
           AND CERTIFY_CD = :certifyCd
        `,
        { 
          replacements: {
            certifyKey:certifyKey,
            certifyCd:certifyCd,
          },
          type: QueryTypes.SELECT, transaction ,
          mapToModel: true,
        },
      );

    return certifyInfo[0];
  }
  
}
