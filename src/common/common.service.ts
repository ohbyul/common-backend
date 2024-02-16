import { Injectable, UnauthorizedException, InternalServerErrorException, StreamableFile } from '@nestjs/common';
import { CommonQuery } from './common.queries';
import { SMSSender } from 'src/lib/sms-sender';
import { EmailSender } from 'src/lib/email-sender';
import { PublicApi } from 'src/lib/public-api';
import { BoardQuery } from 'src/board/board.queries';
import { Crypto } from 'src/lib/crypto';

import Admin_zip from 'adm-zip';
import { CloudApi } from 'src/lib/cloud-api';
import moment from 'moment';
import { Stream } from 'stream';
@Injectable()
export class CommonService {

  private batchName = process.env['BATCH_NAME'];
  private filePath = "bbs-attachment-file";

  constructor(
    private commonQuery: CommonQuery,
    private SMSSender: SMSSender,
    private emailSender: EmailSender,
    private publicApi: PublicApi,
    private boardQuery: BoardQuery,
    private crypto: Crypto,
    private cloudApi: CloudApi,
  ) { }

  /*************************************************
   * 사용자 권한별 메뉴 리스트
   * 
   * @param userId
   * @returns 메뉴 리스트
   ************************************************/
  async getMenuList(params: any) {
    let { props } = params;
    let { userId } = props
    let menuJoinString = '';
    if (userId) {
      menuJoinString = `
        JOIN TB_MENU_AUTH tma ON tm.MENU_ID = tma.MENU_ID AND tma.DELETE_YN = 'N'
        JOIN TB_USER tu ON tma.AUTH_CD = tu.AUTH_CD AND tu.STATUS_CD = 'APPROVAL' AND tu.LOGIN_ID = '${userId}'`
    } else {
      menuJoinString = `
        JOIN TB_MENU_AUTH tma ON tm.MENU_ID = tma.MENU_ID AND tma.DELETE_YN = 'N' AND tma.AUTH_CD ='GUEST' `
    }
    let menuList: any = await this.commonQuery.getMenuList({ ...params, menuJoinString });

    if (menuList) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: menuList
      };
    } else {
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }

  /*************************************************
   * 기관리스트 조회
   * 
   * @returns 전체 기관 리스트 
   ************************************************/
  async getOrganizationList(params: any) {
    let { props, user, transaction } = params
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
      orderOptionString = ' ORDER BY tcc.SORT_ORDER ASC , tog.ORGANIZATION_NM ASC';
    }

    /* WHERE OPTION */
    let whereOptionString = '';
    let whereOptionArr = [];
    if (whereOptions != undefined) {
      whereOptionArr = whereOptions.map((strItems) => {
        let items = JSON.parse(strItems);

        // 기관 제외 목록
        if (items.where_key === 'DISABLE_LIST') {
          let tempArr = items.where_value.map(temp => {
            return `tog.ORGANIZATION_CD != ${temp.organizationCd}`
          })
          return tempArr.join(' AND ')

        } else {
          if (items.where_type === 'like') {
            let where_value = items.where_value.toString().replace(/'/g, "\\'")
            return `${items.where_key} like '%${where_value}%'`;
          } else {
            return `${items.where_key} = '${items.where_value.toString()}'`;
          }
        }
      });
    }
    if (whereOptionArr.length > 0) {
      whereOptionString = ' AND ' + whereOptionArr.join(' AND ');
    } else {
      whereOptionString = ' ';
    }

    //[1] 기관 조회
    let organizationList: any = await this.commonQuery.getOrganizationList({
      ...params
      , offset, pageLength
      , whereOptionString, orderOptionString
    });
    //[2] 기관 토탈 카운트
    let organizationTotalCount: any = await this.commonQuery.getOrganizationTotalCount({
      ...params
      , whereOptionString
    });
    if (organizationList.length > 0) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: organizationList,
        totalCount: organizationTotalCount
      };
    } else {
      return {
        statusCode: 10000,
        message: '게시글이 없습니다.',
        data: [],
        totalCount: 0
      };
    }
  }

  /*************************************************
   * 세션 기관 정보 
   * - 프로젝트 생성시, 생성 기관 정보 조회
   * 
   * @returns 세션 기관 정보
   ************************************************/
  async getSessionOrganizationInfo(params: any) {

    let organization: any = await this.commonQuery.getOrganizationInfoByOrganizationCd({ ...params });
    if (organization) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: organization
      };
    } else {
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }

  /*************************************************
  * 기관 정보
  * 
  * @returns 기관 정보
  ************************************************/
  async getOrganizationInfoById(params: any) {

    let organization: any = await this.commonQuery.getOrganizationInfoById({ ...params });
    if (organization) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: organization
      };
    } else {
      throw new InternalServerErrorException({
        statusCode: 10003,
      })
    }
  }


  /*************************************************
   * 기관등록   
   * 
   * @param 
   * @returns 기관등록 생성 성공여부
   ************************************************/
  async insertOrganization(params: object) {
    let { props }: any = params;

    // [0] 이미 등록 체크
    let alreadyCheckOrganizationCd: any = await this.commonQuery.getOrganizationInfoByOrganizationCd(params);

    if (alreadyCheckOrganizationCd) {
      throw new InternalServerErrorException({
        statusCode: 60002,
      })
    }

    else {
      // [1] 생성
      await this.commonQuery.insertOrganization(params);

      return {
        statusCode: 10000,
        message: '정상적으로 등록되었습니다.',
      };
    }
  }

  /*************************************************
   * 기관 정보 수정
   * 
   * @returns 기관 정보 수정
   ************************************************/
  async updateOrganization(params: any) {
    let { props, user, transaction } = params;

    // [1] 기관 변경
    await this.commonQuery.updateOrganization({ ...params });

    return {
      statusCode: 10000,
      message: '정상적으로 수정되었습니다.',
    };

  }

  /*************************************************
   * 그룹CD별 코드 리스트 조회   
   * 
   * @returns 그룹CD별 코드 리스트
   ************************************************/
  async getCommonCodeList(params: any) {
    let commonCodeList: any = await this.commonQuery.getCommonCodeList({ ...params });

    if (commonCodeList) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: commonCodeList
      };
    } else {
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }

  /*************************************************
   * 그룹CD & 상위공통 코드별 리스트 조회   
   * 
   * @returns 그룹CD & 상위공통 코드별  코드 리스트
   ************************************************/
  async getCommonBoardCodeList(params: any) {
    let commonUpperCodeList: any = await this.commonQuery.getCommonBoardCodeList({ ...params });

    if (commonUpperCodeList) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: commonUpperCodeList
      };
    } else {
      return {
        statusCode: 10002,
        message: '실패'
      }
    }
  }

  /*************************************************
   * SMS 발송
   * 
   * @returns 성공실패
   ************************************************/
  async sendSMS(params: any) {

    let receiveData = await this.SMSSender.sendSMS(params.props);

    if (receiveData) {
      return {
        statusCode: 10000,
        message: '정상적으로 발송되었습니다.',
      };
    } else {
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }

  /*************************************************
   * EMAIL 발송
   * 
   * @returns 성공실패
   ************************************************/
  async sendEmail(params: any) {

    let receiveData = await this.emailSender.sendEmail(params.props);

    if (receiveData) {
      return {
        statusCode: 10000,
        message: '정상적으로 발송되었습니다.',
      };
    } else {
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }
  /*************************************************
   * 메세지 발송 템플릿 조회
   * 
   * @returns 성공실패
   ************************************************/
  async getMSGTemplates(params: any) {

    let msgTemplateData = await this.commonQuery.getMSGTemplates({ ...params });

    if (msgTemplateData) {
      return msgTemplateData;
    } else {
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }

  /*************************************************
   * 에디터 이미지 s3업로드 , 이미지 url 가져오기
   * 
   * @param 
   * @returns 이미지 url
   ************************************************/
  async uploadEditorImage(params: any) {
    let { props } = params;
    let { files } = props;

    let fileUrl;

    if (files.length > 0) {
      for (let file of files) {
        let result = await this.cloudApi.upload(this.filePath, file, 'public-read');

        fileUrl = result.Location;
      }
    }

    return {
      statusCode: 10000,
      message: 'image url in editor',
      data: fileUrl
    };
  }

  /*************************************************
   * 공휴일 데이터 - 공공데이터
   * 
   * @returns 성공실패
   ************************************************/
  async getPublicHoliday(params: any) {
    let { props, transaction } = params
    let { year, month } = props

    let receiveData = await this.publicApi.getPublicHoliday(params);

    const responseCode = receiveData.data.response.header.resultCode
    let resultList = receiveData.data.response.body.items.item
    if (responseCode !== '00' || !resultList) {
      return {
        statusCode: 10000,
        message: `동기화를 실패하였습니다. [ERRORCODE] ${responseCode}`,
      };
    }

    for (let holiday of resultList) {
      // [1] 해당 날짜 데이터 조회
      props['holiday'] = moment(holiday?.locdate, 'YYYYMMDD').format('YYYY-MM-DD')
      let holidayData = await this.commonQuery.getHolidayByDate({ ...params })

      props['holidayName'] = holiday?.dateName
      if (!holidayData) {
        // 등록 (해당날짜에 데이터 미존재)
        await this.commonQuery.insertHoliday({ ...params, user: { userId: this.batchName } });
      }

      else {
        if (holidayData?.MODIFY_LOGIN_ID === this.batchName) {
          // 수정 (해당날짜 데이터 존재)
          props['id'] = holidayData?.ID
          await this.commonQuery.updateHoliday({ ...params, user: { userId: this.batchName } });
        }
      }
    }
    if (resultList?.length > 0) {
      return {
        statusCode: 10000,
        message: '정상적으로 동기화를 성공하였습니다.',
      };
    }
  }


  /*************************************************
   * 공휴일 데이터
   * 
   * @returns 성공실패
   ************************************************/
  async getHolidayList(params: any) {
    let { props, user, transaction } = params
    let { page, pageLength, year, month } = props
    page = page === 0 ? 1 : page;
    const offset = (page - 1) * pageLength;

    /* WHERE OPTION */
    let whereOptionString = '';
    let whereOptionArr = [];
    whereOptionArr.push(`DATE_FORMAT(th.HOLIDAY , '%Y') = '${year}'`)
    if (month && month !== '') {
      whereOptionArr.push(`DATE_FORMAT(th.HOLIDAY , '%m') = '${month}'`)
    }

    if (whereOptionArr.length > 0) {
      whereOptionString = ' AND ' + whereOptionArr.join(' AND ');
    } else {
      whereOptionString = ' ';
    }

    let holidays = await this.commonQuery.getHolidayList({
      ...params
      , offset, pageLength
      , whereOptionString
    });
    let holidayTotalCount = await this.commonQuery.getHolidayTotalCount({
      ...params
      , whereOptionString
    });

    let holidayLastSyncDtm = await this.commonQuery.getHolidayLastSyncDtm({ ...params });

    if (holidays) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: holidays,
        totalCount: holidayTotalCount,
        lastSyncDtm: holidayLastSyncDtm
      };
    } else {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: [],
        totalCount: 0,
        lastSyncDtm: holidayLastSyncDtm
      };
    }
  }

  /*************************************************
   * 공휴일 등록
   * 
   * @param 
   * @returns 공휴일 등록 생성 성공여부
   ************************************************/
  async insertHoliday(params: any) {
    let { props, user, transaction } = params
    let { holiday, holidayName } = props;

    // [1] 조회
    let holidayData = await this.commonQuery.getHolidayByDate({ ...params })
    if (!holidayData) {
      // 등록 (해당날짜에 데이터 미존재)
      await this.commonQuery.insertHoliday({ ...params });
    }

    else {
      if (holidayData?.MODIFY_LOGIN_ID === this.batchName) {
        // 수정 (해당날짜 '배치' 데이터 존재)
        props['id'] = holidayData?.ID
        await this.commonQuery.updateHoliday({ ...params });
      }

      else {
        // 경고 (해당날짜 관리자 데이터 존재)
        throw new InternalServerErrorException({
          statusCode: 70002,
        })
      }
    }

    return {
      statusCode: 10000,
      message: '정상적으로 등록되었습니다.',
    };
  }

  /*************************************************
   * 공휴일 수정
   * 
   * @returns 공휴일 수정
   ************************************************/
  async updateHoliday(params: any) {
    let { props, user, transaction } = params;

    await this.commonQuery.updateHoliday({ ...params });

    return {
      statusCode: 10000,
      message: '정상적으로 수정되었습니다.',
    };
  }

  /*************************************************
   * 공휴일 삭제
   * 
   * @returns 공휴일 삭제
   ************************************************/
  async deleteHoliday(params: any) {
    let { props, user, transaction } = params;

    await this.commonQuery.deleteHoliday({ ...params });

    return {
      statusCode: 10000,
      message: '정상적으로 삭제되었습니다.',
    };
  }

  /*************************************************
  * 공지사항 *첨부파일* 다운로드 -ALL
  * 
  * @param
  * @returns 
  ************************************************/
  // async downloadFileAll(params: any) {
  //   let { props, transaction } = params;
  //   let { encryptoId } = props

  //   //[0] 암호화된 board Id 디코드
  //   let decrypt = await this.crypto.getDecrypto(encryptoId)
  //   const id = String(decrypt.id);

  //   //[1] 해당 borad 의 파일 조회
  //   props['fileId'] = id
  //   let fileList: any = await this.boardQuery.getBoardAllFiles({ ...params });

  //   //[2] 압축파일
  //   let fileZip: any = await this.zipFileDownload({ fileList });
  //   return fileZip;
  // }


  /*************************************************
   * 공통 사용 - zip파일 다운로드
   * 
   * @param
   * @returns 
   ************************************************/
  async zipFileDownload(params: any) {
    let { fileList } = params;

    try {
      let zipName = 'files.zip';
      let zip = new Admin_zip();
      const endpoint = process.env['NCP_S3_ENDPOINT']
      for (let [i, data] of fileList.entries()) {
        const filePath = data.FILE_PATH.slice(data.FILE_PATH.lastIndexOf('/') + 1)
        /*****[url]*****/
        // const fileUrl = `${endpoint}/${filePath}/${data.SAVE_FILE_NM}`
        // let stream: any = await fetch(fileUrl);
        // const arrayBuffer = await stream.arrayBuffer();
        // const buffer = Buffer.from(arrayBuffer);

        /*****[s3]*****/
        let props = {
          bucket: endpoint,
          path: filePath,
          fileName: data.SAVE_FILE_NM,
        }

        let stream: any = await this.cloudApi.getS3DataStream({ props })
        const arrayBuffer = await this.stream2buffer(stream)
        const buffer = Buffer.from(arrayBuffer)

        zip.addFile(`${data.ORIGINAL_FILE_NM}`, buffer);
      }
      let zipBuffer = zip.toBuffer();

      return {
        statusCode: 10000,
        message: '정상적으로 다운로드됩니다.',
        zipBuffer,
        zipName: zipName,
      };
    } catch (exception) {
      console.log('zipFileDownload Error : ', exception);
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }

  async stream2buffer(stream: Stream): Promise<Buffer> {

    return new Promise<Buffer>((resolve, reject) => {

      const _buf = Array<any>();

      stream.on("data", chunk => _buf.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(_buf)));
      stream.on("error", err => reject(`error converting stream - ${err}`));

    });
  }



}

