import { Inject, Injectable } from '@nestjs/common';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class UserTracking {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON,
  ) { }

  // 생성
  async createUserTracking(params: any) {
    let { USER_ID, URL, ACTION_TYPE, ACTION_DTM, BEFORE_DATA, AFTER_DATA } = params;

    // 1 : 회원가입 
    // 2 : 글 생성 (공지,과제)
    // 3 : 댓글 생성
    // 4 : 유저 상태 변경
    // 5 : 파일 다운로드
    // 6 : 

    // let afterJson: any = JSON.stringify({
    //   af_ssid: ssid,
    //   af_pw: hashPassword,
    //   af_salt: salt,
    //   af_organization: organization,
    //   af_auth_level: auth_level,
    // });

  }

}
