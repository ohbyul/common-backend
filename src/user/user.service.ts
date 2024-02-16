import { Injectable, UnauthorizedException, InternalServerErrorException, StreamableFile } from '@nestjs/common';
import { UserQuery } from './user.queries';
import { AuthQuery } from '../auth/auth.queries';
import { createHash } from 'crypto';
import { Transaction } from 'sequelize';
import { CommonQuery } from 'src/common/common.queries';
import { SMSSendDto } from 'src/dto/common/sms-send.dto';
import { MSGTemplatesDto } from 'src/dto/common/msg-templates.dto';
import { SMSSender } from 'src/lib/sms-sender';
import { EmailSender } from 'src/lib/email-sender';
import { EmailSendDto } from 'src/dto/common/email-send.dto';
import Utils from 'src/util/utils';
import { CloudApi } from 'src/lib/cloud-api';
import moment from 'moment';

@Injectable()
export class UserService {
  constructor(
    private userQuery: UserQuery,
    private authQuery: AuthQuery,
    private commonQuery: CommonQuery,
    private emailSender: EmailSender,
    private SMSSender: SMSSender,
    private cloudApi: CloudApi,
  ) { }

  private aesSecretkey = process.env['AES_SECRETKEY'];
  private filePath = "user-sign";
  private joinUrl = process.env['JOIN_URL'];

  async checkValidEmail(params: object) {
    const { props, transaction }: any = params;
    const isParticipantMember: any = await this.authQuery.participantEmail(params);
    return {
      statusCode: 10000,
      message: isParticipantMember ? '이미 참여연구자로 등록된 이메일주소입니다. 참여요청 메일의 링크를 통해 가입해 주세요.' : '등록가능한 메일입니다.',
      data: { isChk: !isParticipantMember }
    };

  }
  /*************************************************
   * 인증코드 발송      
   * 
   * @param SignUpDto
   * @returns 인증코드 발송 여부
   ************************************************/
  async insertAuthCode(params: object) {
    let { props, transaction }: any = params;
    let { userId, mobileNo, authEmailNo, authMobileNo, authType, userNm } = props

    if (authType === 'email') {
      let alreadyCheckUserIdQuery: any = await this.authQuery.userInfo(params);
      if (alreadyCheckUserIdQuery) {
        return {
          statusCode: 10000,
          message: '이미 등록된 이메일 주소입니다.',
          data: { isChk: false }
        };
      } else {
        let certifyKey = userId
        let certifyCd = Utils.getInstance().getRandomNumber(6)
        let certifyType = authType
        let taskTypeCd = '2005'
        //인증번호 저장
        await this.authQuery.insertCertifyCd({ transaction, props: { certifyKey, certifyCd, certifyType } })

        let MSGTemplatesDto: MSGTemplatesDto = await this.commonQuery.getMSGTemplates({ taskTypeCd })

        let body = MSGTemplatesDto.contents.replace(/#{certifycd}/g, certifyCd)
        body = body.replace(/#{userNm}/g, userNm)

        let emailSendDto: EmailSendDto = {
          senderAddress: MSGTemplatesDto.sender,
          senderName: MSGTemplatesDto.senderNm,
          title: MSGTemplatesDto.title,
          body: body,
          address: userId,
          name: MSGTemplatesDto.senderNm
        }

        let responseData = await this.emailSender.sendEmail(emailSendDto)
        console.log(responseData)

      }
    } else {
      let alreadyCheckMobileNoQuery: any = await this.authQuery.userInfoByMobileNo(params);
      if (alreadyCheckMobileNoQuery) {
        return {
          statusCode: 10000,
          message: '이미 등록된 휴대폰 번호입니다.',
          data: { isChk: false }
        };
      } else {
        let certifyKey = mobileNo
        let certifyCd = Utils.getInstance().getRandomNumber(6)
        let certifyType = authType
        let taskTypeCd = '1012'

        //인증번호 저장
        await this.authQuery.insertCertifyCd({ transaction, props: { certifyKey, certifyCd, certifyType } })

        let MSGTemplatesDto: MSGTemplatesDto = await this.commonQuery.getMSGTemplates({ taskTypeCd })

        let smsSendDto: SMSSendDto = {
          SMSType: MSGTemplatesDto.msgTypeCd,
          smsSenderNo: MSGTemplatesDto.sender,
          receiveNo: mobileNo,
          subject: MSGTemplatesDto.title,
          content: MSGTemplatesDto.contents.replace(/#{certifycd}/g, certifyCd)
        }

        let responseData = await this.SMSSender.sendSMS(smsSendDto)
        console.log(responseData)
      }
    }


    return {
      statusCode: 10000,
      message: '인증번호가 발송되었습니다.',
      data: { isChk: true }
    };
  }

  /*************************************************
   * 인증코드 확인      
   * 
   * @param SignUpDto
   * @returns 인증코드 확인 여부
   ************************************************/
  async getAuthCode(params: object) {
    let { props, transaction }: any = params;
    let { userId, mobileNo, authEmailNo, authMobileNo, authType } = props

    let certifyKey = authType === 'email' ? userId : mobileNo
    let certifyCd = authType === 'email' ? authEmailNo : authMobileNo

    //인증번호 확인
    let certifyInfo = await this.authQuery.getCertifyCd({ transaction, props: { certifyKey, certifyCd } })
    if (certifyInfo) {
      return {
        statusCode: 10000,
        message: '인증이 완료되었습니다.',
        data: { isChk: true }
      };
    } else {
      return {
        statusCode: 10000,
        message: '인증번호를 정확히 입력해 주세요.',
        data: { isChk: false }
      };

    }

  }
  /*************************************************
   * 사용자 등록     
   * 
   * @param SignUpDto
   * @returns 회원가입 성공 여부
   ************************************************/
  async insertUser(params: object) {
    let { props }: any = params;
    let { userPwd, statusCd, approvalLoginId, privacy, service }: any = props;

    // [0] 이미 가입 체크
    let alreadyCheckUserNameQuery: any = await this.authQuery.userInfo(params);

    if (alreadyCheckUserNameQuery) {
      throw new InternalServerErrorException({
        statusCode: 30002,
      })
    }

    else {

      if (statusCd === 'APPROVAL') {
        props['approvalDtm'] = moment().format('YYYY-MM-DD HH:mm:ss')
      }

      // 비밀번호 암호화
      let hashPassword = createHash('sha512')
        .update(userPwd)
        .digest('hex');

      props['hashPassword'] = hashPassword;

      const termsAgree = {
        termsKindCd: '',
        termsTypeCd: 'USER'
      }

      // [1] 생성
      await this.userQuery.insertUser(params);

      return {
        statusCode: 10000,
        message: '회원가입이 완료되었습니다.',
      };
    }
  }


  /*************************************************
   * 비밀번호 3개월 권고 날짜 변경
   * 
   * @param UserChgPwdDateDto
   * @returns 비밀번호 3개월 권고일 변경
   ************************************************/
  async updateLastPwChgDate(params: any) {
    let { props, transaction }: any = params;
    let { userId }: any = props;

    await this.userQuery.updateLastPwChgDate({
      userId
      , pwdResetYn: 'N'
      , transaction
    });

    return {
      statusCode: 10000,
      message: '비밀번호 3개월 권고 날짜 변경 완료',
    };
  }

  /*************************************************
   * 사용자 아이디 중복확인     
   * 
   * @param {String} userId  사용자 아이디
   * @returns 사용자 아이디 중복여부
   ************************************************/
  async getDuplicationCheck(params: any) {
    let alreadyCheckUserNameQuery: any = await this.authQuery.userInfo(params);

    if (!alreadyCheckUserNameQuery) {
      return {
        statusCode: 10000,
        message: '사용 가능한 아이디입니다.',
      };
    } else {
      throw new InternalServerErrorException({
        statusCode: 30002,
      })
    }
  }

  /*************************************************
   * 로그인시,  User History 업데이트 & 생성
   * 
   * @param LoginDto
   * @returns 
   ************************************************/
  async userLastLoginUpdate(params: any) {
    //유저 로그인 라스트 시간 업데이트
    await this.userQuery.updateUserLastLogin(params);

    //유저 로그인 히스토리 생성  
    await this.userQuery.insertUserLoginHistory(params);
  }

  /*************************************************
   * 기관 별 유저 조회
   * 
   * @returns 기관 별 유저 
   ************************************************/
  async getOrganizationUsers(params: any) {
    let { props, user, transaction, organizationCd } = params
    let { page, pageLength, whereOptions, orderOptions } = props;
    page = page === 0 ? 1 : page;
    const offset = (page - 1) * pageLength;

    /** ORDER OPTION */
    let orderOptionString = '';
    if (orderOptions != undefined) {
      const orderOptionArr = orderOptions.map((strItems) => {
        let items = JSON.parse(strItems);
        return items.column_name + ' ' + items.orderOption.toString();
      });

      if (orderOptionArr.length > 0) {
        orderOptionString = ' ORDER BY ' + orderOptionArr.join(', ');
      }
    } else {
      orderOptionString = ' ORDER BY tu.ID DESC';
    }

    /* WHERE OPTION */
    let whereOptionString = '';
    let whereOptionArr = [];
    if (whereOptions != undefined) {
      whereOptionArr = whereOptions.map((strItems) => {
        let items = JSON.parse(strItems);
        const whereValue = items.where_value.toString().replace(/'/g, "\\'")
        if (items.where_type === 'like') {
          return `${items.where_key} like '%${whereValue}%'`;
        } else {
          return `${items.where_key} = '${whereValue}'`;
        }
      });
    }
    if (whereOptionArr.length > 0) {
      whereOptionString = ' AND ' + whereOptionArr.join(' AND ');
    } else {
      whereOptionString = ' ';
    }

    //[1] 기관 별 사용자 조회
    let userList: any = await this.userQuery.getOrganizationUsers({
      ...params
      , offset, pageLength
      , whereOptionString, orderOptionString
    });
    //[2] 기관 별 사용자 토탈 카운트
    let userTotalCount: any = await this.userQuery.getOrganizationUsersTotalCount({
      ...params
      , whereOptionString
    });
    if (userList.length > 0) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: userList,
        totalCount: userTotalCount
      };
    } else {
      return {
        statusCode: 10000,
        message: '연구원이 없습니다.',
        data: [],
        totalCount: 0
      };
    }
  }

  /*************************************************
   * 사용자 서명 조회 - 마이페이지
   * 
   * @param 
   * @returns 사용자 서명 조회
   ************************************************/
  async getUserSign(params: any) {
    let { props, user, transaction } = params

    const userSign: any = await this.userQuery.getUserSign({ ...params });

    if (userSign) {
      return {
        statusCode: 10000,
        message: '성공적으로 조회되었습니다.',
        data: userSign,
        isExist: true
      }
    } else {
      return {
        statusCode: 10000,
        message: '서명 정보가 존재하지 않습니다.',
        isExist: false
      }
    }

  }

  /*************************************************
   * 사용자 서명 등록/업데이트
   * 
   * @param 
   * @returns  사용자 서명 등록/업데이트
   ************************************************/
  async insertUserSign(params: any) {
    let { props, user, transaction } = params;
    let { signPassword, files } = props

    // [1] 사용자 서명 등록/ 업데이트
    if (files) {

      if (files.length > 0) {
        for (let file of files) {

          await this.cloudApi.upload(this.filePath, file)

          let createData = {
            originalFileNm: file.info.originalFileName,
            saveFileNm: file.info.saveFileName,
            extensionNm: file.info.fileExtension,
            filePath: this.filePath,
            fileSize: file.info.fileSize,
          }

          const result: any = await this.userQuery.insertUserSign({ ...params, fileInfo: createData });
        }
      }
    }

    // [2] 간편비밀번호 등록/업데이트
    if (signPassword) {
      await this.userQuery.updateUserSignPassword({ ...params });
    }

    return {
      statusCode: 10000,
      message: '정상적으로 저장되었습니다.',
    };
  }

  /*************************************************
   * 사용자 서명 원본이미지
   * 
   * @param 
   * @returns 사용자 서명 원본이미지
   ************************************************/
  async getUserSignImage(params: any): Promise<StreamableFile> {
    let { props, user, transaction } = params

    const userSign: any = await this.userQuery.getUserSign({
      ...params
      , user: { userId: props.userId }
    });

    if (!userSign) {
      return
    }

    let param = {
      props: {
        path: userSign.FILE_PATH,
        fileName: userSign.SAVE_FILE_NM,
      }
    }
    return this.cloudApi.getS3Data(param)
  }

  /*************************************************
   * 사용자 서명 삭제
   * 
   * @param 
   * @returns  사용자 서명 삭제
   ************************************************/
  async deleteUserSign(params: any) {
    let { props, user, transaction } = params;

    await this.userQuery.deleteUserSign({ ...params });

    return {
      statusCode: 10000,
      message: '정상적으로 삭제되었습니다.',
    };
  }

  /*************************************************
   * 본인확인
   * 
   * @param 
   * @returns 본인확인
   ************************************************/
  async getCheckAuth(params: any) {
    let { props, user, transaction } = params;
    let { userId, userPwd } = props
    // USER ID 조회
    const userInfo: any = await this.authQuery.userInfo(params);

    let isCheck = false;
    if (userInfo) {
      let dbLocalPw: string = userInfo.LOGIN_PWD;
      let hashPassword: string = createHash('sha512').update(userPwd).digest('hex');
      if (hashPassword === dbLocalPw) {
        isCheck = true
      }
    }

    if (isCheck) {
      return {
        statusCode: 10000,
        message: '정상적으로 본인 확인되었습니다.',
        data: isCheck
      };
    } else {
      return {
        statusCode: 10000,
        message: '비밀번호가 일치하지 않습니다.',
        data: isCheck
      };
    }
  }

  /*************************************************
   * 연구책임자 서명 본인확인
   * 
   * @param 
   * @returns 연구책임자 서명 본인확인
   ************************************************/
  async getCheckSignPassword(params: any) {
    let { props, user, transaction } = params;
    let { userId, signPassword } = props
    // USER ID 조회
    const userInfo: any = await this.authQuery.userInfo(params);

    let isCheck = false;
    if (userInfo) {
      let dbLocalSignPassword: string = userInfo.SIGN_PASSWORD;
      if (signPassword === dbLocalSignPassword) {
        isCheck = true
      }
    }

    if (isCheck) {
      return {
        statusCode: 10000,
        message: '정상적으로 본인 확인되었습니다.',
        data: isCheck
      };
    } else {
      return {
        statusCode: 10000,
        message: '비밀번호가 일치하지 않습니다.',
        data: isCheck
      };
    }
  }


  /**********************[사용자 관리]***********************/
  /*************************************************
   * 사용자 리스트   
   * 
   * @param 
   * @returns 사용자 리스트
   ************************************************/
  async getUesrList(params: any) {
    let { props, user } = params
    let { page, pageLength, whereOptions, orderOptions } = props;
    page = page === 0 ? '1' : page;
    const offset = (page - 1) * pageLength;
    /** ORDER OPTION */
    let orderOptionString = '';
    if (orderOptions != undefined) {
      const orderOptionArr = orderOptions.map((strItems) => {
        let items = JSON.parse(strItems);
        return items.column_name + ' ' + items.orderOption.toString();
      });

      if (orderOptionArr.length > 0) {
        orderOptionString = ' ORDER BY ' + orderOptionArr.join(', ') + ', tu.ID DESC';
      }
    } else {
      orderOptionString = ' ORDER BY tu.ID DESC';
    }

    /* WHERE OPTION */
    let whereOptionString = '';
    let whereOptionArr = [];
    if (whereOptions != undefined) {
      whereOptionArr = whereOptions.map((strItems) => {
        let items = JSON.parse(strItems);

        // %%
        if (items.where_type === 'like') {
          const whereValue = items.where_value.toString().replace(/'/g, "\\'")
          // 암호화 X tu.*
          return `${items.where_key} like '%${whereValue}%'`;
        }

        // =
        else
          if (items.where_type === 'equal') {
            return `${items.where_key} = '${items.where_value.toString()}'`;
          }

          // >= , <=
          else
            if (items.where_type === '>=' || items.where_type === '<=') {
              return `DATE_FORMAT(tu.${items.where_key},'%Y-%m-%d') ${items.where_type} DATE_FORMAT('${items.where_value}','%Y-%m-%d')`;
            }

            // IN ()
            else
              if (items.where_type === 'in') {
                let temp = JSON.stringify(items.where_value);
                let trans = temp.replace('[', '(').replace(']', ')').replace(/"/gi, "'");
                return `tu.${items.where_key} IN ${trans} `
              }

      });

    }

    if (whereOptionArr.length > 0) {
      whereOptionString = ' AND ' + whereOptionArr.join(' AND ');
    } else {
      whereOptionString = ' ';
    }

    let userList: any = await this.userQuery.getUesrList({
      ...params
      , offset, pageLength
      , whereOptionString, orderOptionString
    });

    let userTotalCount: any = await this.userQuery.getUesrTotalCount({
      ...params
      , whereOptionString
    });

    if (userList.length > 0) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: userList,
        totalCount: userTotalCount
      };
    } else {
      return {
        statusCode: 10000,
        message: '데이터가 없습니다.',
        data: [],
        totalCount: 0
      };
    }
  }


  /*************************************************
   * 사용자 상태 변경
   * 
   * @param 
   * @returns 사용자 상태 변경 성공여부
   ************************************************/
  async updateUserStatus(params: any) {
    let { props } = params
    let { users, statusCd } = props;

    let status: string
    let taskTypeCd: string
    if (statusCd === 'APPROVAL') {
      status = '승인완료'
      taskTypeCd = '2001'
    }
    else
      if (statusCd === 'REJECT') {
        status = '승인거절'
        taskTypeCd = '2002'
      }

    for (let userId of users) {
      props['userId'] = userId
      await this.userQuery.updateUserStatus({ ...params });

      // 승인 , 거절 이메일 send
      const user: any = await this.authQuery.userInfo(params);

      // [1] 메세지 템플릿 조회
      let MSGTemplatesDto: MSGTemplatesDto = await this.commonQuery.getMSGTemplates({ taskTypeCd })
      const url = this.joinUrl
      let body = MSGTemplatesDto.contents.replace(/#{userId}/g, userId)
        .replace(/#{userNm}/g, user?.USER_NM)
        .replace(/#{joinDtm}/g, moment(user?.JOIN_DTM).format('YYYY-MM-DD HH:mm:ss'))
        .replace(/#{approvalDtm}/g, moment(user?.APPROVAL_DTM).format('YYYY-MM-DD HH:mm:ss'))
        .replace(/#{url}/g, url)
        .replace(/#{rejectDtm}/g, moment(user?.REJECT_DTM).format('YYYY-MM-DD HH:mm:ss'))
        .replace(/#{rejectReason}/g, user?.REJECT_REASON_CD_NM + " " + user?.REJECT_REASON_ETC)

      let emailSendDto: EmailSendDto = {
        senderAddress: MSGTemplatesDto.sender,
        senderName: MSGTemplatesDto.senderNm,
        title: MSGTemplatesDto.title,
        body: body,
        address: userId,
        name: MSGTemplatesDto.senderNm
      }
      let receiveData = await this.emailSender.sendEmail(emailSendDto);

    }

    return {
      statusCode: 10000,
      message: `성공적으로 ${status} 되었습니다.`
    }
  }

  /*************************************************
   * 사용자 상세
   * 
   * @param 
   * @returns 사용자 상세
   ************************************************/
  async getUserInfo(params: any) {
    let { props } = params
    let { id, userId } = props;

    let whereStrOptions: string
    if (id) {
      whereStrOptions = `AND tu.ID = ${id}`
    }

    else
      if (userId) {
        whereStrOptions = `AND tu.LOGIN_ID = '${userId}'`
      }


    props['whereStrOptions'] = whereStrOptions
    let user: any = await this.authQuery.getUserInfoById(params);

    if (user) {
      return {
        statusCode: 10000,
        message: `정상적으로 조회되었습니다.`,
        data: user
      }
    }

    else {
      throw new InternalServerErrorException({
        statusCode: 10003,
      })
    }
  }

  /*************************************************
   * 사용자 로그인 내역 리스트  
   * 
   * @param 
   * @returns 사용자 로그인 내역 리스트
   ************************************************/
  async getUesrLoginHistory(params: any) {
    let { props } = params
    let { page, pageLength, whereOptions, orderOptions, loginId } = props;
    page = page === 0 ? '1' : page;
    const offset = (page - 1) * pageLength;

    /** ORDER OPTION */
    let orderOptionString = '';
    if (orderOptions != undefined) {
      const orderOptionArr = orderOptions.map((strItems) => {
        let items = JSON.parse(strItems);
        return items.column_name + ' ' + items.orderOption.toString();
      });

      if (orderOptionArr.length > 0) {
        orderOptionString = ' ORDER BY ' + orderOptionArr.join(', ') + ', tulh.ID DESC';
      }
    } else {
      orderOptionString = ' ORDER BY tulh.ID DESC';
    }

    /* WHERE OPTION */
    let whereOptionString = '';
    let whereOptionArr = []
    if (whereOptions != undefined) {
      whereOptionArr = whereOptions.map((strItems) => {
        let items = JSON.parse(strItems);
        if (items.where_type === 'like') {
          return `${items.where_key} like '%${items.where_value.toString()}%'`;
        } else {
          return `${items.where_key} = '${items.where_value.toString()}'`;
        }
      });
    }

    // 전체 리스트 조회시, loginId = undefind
    if (loginId) {
      whereOptionArr.push(`tulh.LOGIN_ID = '${loginId}'`)
    }

    if (whereOptionArr.length > 0) {
      whereOptionString = ' AND ' + whereOptionArr.join(' AND ');
    } else {
      whereOptionString = ' ';
    }

    let userHistoryList: any = await this.userQuery.getUesrLoginHistory({
      ...params
      , offset, pageLength
      , whereOptionString, orderOptionString
    });

    let userHistoryTotalCount: any = await this.userQuery.getUesrLoginHistoryTotalCount({
      ...params
      , whereOptionString
    });

    if (userHistoryList.length !== 0) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: userHistoryList,
        totalCount: userHistoryTotalCount
      };
    } else {
      return {
        statusCode: 10000,
        message: '데이터가 없습니다.',
        data: [],
        totalCount: 0
      };
    }
  }


  /*************************************************
   * 사용자 휴대번호 중복체크
   * 
   * @param 
   * @returns 사용자 휴대번호 중복체크
   ************************************************/
  async getUserMobileNo(params: any) {
    let { props } = params
    let { id, mobileNo } = props

    const whereStrOptions = ` 
      AND tu.ID != ${id} 
      AND CAST(AES_DECRYPT(UNHEX(tu.MOBILE_NO), '${this.aesSecretkey}', tu.ENCRYPT_IV) AS CHAR) = '${mobileNo}' 
    `
    props['whereStrOptions'] = whereStrOptions

    let user: any = await this.authQuery.getUserInfoById(params);

    if (user) {
      return {
        statusCode: 10000,
        message: '사용불가능한 휴대폰번호 입니다.',
        data: { isUse: false }
      };
    } else {
      return {
        statusCode: 10000,
        message: '사용가능한 휴대폰번호 입니다.',
        data: { isUse: true }
      };
    }
  }

  /*************************************************
   * 관리포탈 - 회원 관리 (권한수정)
   * 
   * @param 
   * @returns 관리포탈 - 회원 관리 (권한수정)
   ************************************************/
  async updateUserAuth(params: any) {
    let { props, user, transaction } = params
    let { loginId, authCd } = props

    await this.userQuery.updateUserAuth({ ...params })

    return {
      statusCode: 10000,
      message: '정상적으로 수정되었습니다.',
    };
  }
  /*************************************************
   * 관리포탈 - 회원 관리 (수정)
   * 
   * @param 
   * @returns 관리포탈 - 회원 관리
   ************************************************/
  async updateUser(params: any) {
    let { props, user, transaction } = params
    let { loginId, userPwd } = props
    let { userId } = user

    // [1] 해당 아이디 정보
    props['userId'] = loginId
    const userInfo: any = await this.authQuery.userInfo(params);

    if (userPwd) {
      const dbPw = userInfo.LOGIN_PWD;          //기존 비밀번호
      const preDbPw = userInfo.PRE_LOGIN_PWD;   //이전 비밀번호

      const nowPasswordCheck: string = createHash('sha512')
        .update(userPwd)
        .digest('hex');
      //기존 === 현재 
      if (dbPw === nowPasswordCheck) {
        return {
          statusCode: 10000,
          message: '기존 비밀번호와 같습니다.',
          data: { isCheck: false }
        };
      }

      // 이전 === 현재
      else
        if (preDbPw === nowPasswordCheck) {
          return {
            statusCode: 10000,
            message: '이전 비밀번호와 같습니다.',
            data: { isCheck: false }
          };
        }

      // [3] 암호 업데이트
      await this.userQuery.updateUserPwd({
        userId: loginId
        , dbPw
        , pwdResetYn: 'Y'
        , nowPasswordCheck
        , modifyUserId: userId
        , transaction
      });
    }

    // [4] 회원 정보 수정
    await this.userQuery.updateUserInfo({ ...params })
    if (userInfo.USER_NM !== props.userNm) {
      await this.userQuery.updateParticipantInfo({ ...params })
    }
    return {
      statusCode: 10000,
      message: '정상적으로 수정되었습니다.',
      data: { isCheck: true }
    };
  }

  /*************************************************
   * 관리포탈 - 회원 탈퇴
   * 
   * @param 
   * @returns  관리포탈 - 회원 탈퇴
   ************************************************/
  async deleteUser(params: any) {
    let { props, user, transaction } = params

    //[1] SPONSER 여부 
    const sponserYn = await this.userQuery.sponserYn({ ...params })

    if (sponserYn.length > 0) {
      return {
        statusCode: 40004,
        message: '운영 프로젝트 중 스폰서로 대체할 구성원이 없어 탈퇴가 불가합니다.',
      }
    }

    //[2]임상진행중 프로젝트 여부
    const clinicalYn = await this.userQuery.clinicalYn({ ...params })

    if (clinicalYn.length > 0) {
      return {
        statusCode: 40005,
        message: '임상진행중인 프로젝트가 존재합니다. \n 임상 진행중인 프로젝트에서 참여취소 후 탈퇴 처리 바랍니다.',
      }
    }

    //[3] 회원 탈퇴 처리 
    await this.userQuery.deleteUser({ ...params })

    return {
      statusCode: 10000,
      message: '정상적으로 탈퇴 처리 되었습니다.',
    }
  }

  /*************************************************
   * 사용자 비밀번호 리셋
   * 
   * @param {String} userId 
   * @param {String} userPwd 
   * @returns 사용자 비밀번호 리셋 성공여부
   ************************************************/
  // async resetPassword(params: any) {
  //   let { props,user,transaction } = params
  //   let { userId, userPwd } = props;
  //   const modifyUserId = user?.userId

  //   // [1] 해당 아이디 정보
  //   const memberInfo : any = await this.authQuery.userInfo(params);

  //   const dbPw = memberInfo.LOGIN_PWD;

  //   // [2] 랜덤 비밀번호 암호화  
  //   let nowPasswordCheck: string = createHash('sha512')
  //     .update(userPwd)
  //     .digest('hex');

  //   // [3] 현재 비밀번호가 기존 비밀번호와 같은지 확인
  //   if (nowPasswordCheck === dbPw) {
  //     throw new InternalServerErrorException({
  //       statusCode: 30003,
  //     })
  //   } else {
  //     //[4] 암호 업데이트
  //     await this.userQuery.updateUserPwd({
  //       userId
  //       , dbPw
  //       , pwdResetYn : 'Y' 
  //       , nowPasswordCheck
  //       , modifyUserId 
  //       , transaction
  //     }); 

  //     return {
  //       statusCode: 10000,
  //       message: '정상적으로 수정되었습니다.',
  //     };
  //   }
  // }



}
