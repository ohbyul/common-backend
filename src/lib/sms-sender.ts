import { Injectable } from '@nestjs/common';
import { ReqRes } from './req-res';
import moment from "moment-timezone";
import { SMSSendDto } from 'src/dto/common/sms-send.dto';
import { Crypto } from './crypto';

@Injectable()
export class SMSSender {

    private ncpAccesskey = process.env['NCP_ACCESS_KEY'];
    private smsServiceId = process.env['NCP_SMS_SERVICE_ID'];
    private smsSendUrl = process.env['NCP_SMS_SEND_URL'];
    private smsSendUri = process.env['NCP_SMS_SEND_URI'];

    constructor(
        private reqRes:ReqRes,
        private crypto:Crypto
    ) {       
    }

    async sendSMS(smsSendDto:SMSSendDto){
        let responseData;

        try{

            const timestamp : number = moment.tz("Asia/Seoul").valueOf()
            const url : string = this.smsSendUrl.replace('{serviceId}',this.smsServiceId);
            const uri : string = this.smsSendUri.replace('{serviceId}',this.smsServiceId);
            const method : string = 'POST'
            const signature = await this.crypto.makeSignature(timestamp, method , uri)

            let header: object = {
                'Content-Type': 'application/json; charset=utf-8',
                'x-ncp-apigw-timestamp': timestamp,
                'x-ncp-iam-access-key': this.ncpAccesskey,
                'x-ncp-apigw-signature-v2': signature
            };

            let body: object = {
                'type': smsSendDto.SMSType,             // (SMS | LMS | MMS)
                'contentType': "COMM",                  // COMM:일반, AD:광고
                'countryCode': "82",                    // 국가코드 : 한국
                'from': smsSendDto.smsSenderNo,         // 발신번호
                'subject': smsSendDto.subject,          // 제문 LMS, MMS에서만 사용 가능
                'content': smsSendDto.content,          // 내용
                'messages':[
                    {
                        'to': smsSendDto.receiveNo.replace(/-/g,""),    // 수신번호
                        'subject': null,    // 개별 제목
                        'content': null     // 개별 내용
                    }
                ],
                'reserveTime': null,        // 예약발송시간
                'reserveTimeZone': null,    // 예약발송timezone
                'scheduleCode': null        // 등록하려는 스케줄 코드
            }
            
            responseData = await this.reqRes.requestMethod({
              method,
              url,
              header,
              body
            });

            if(responseData.status == 200 || responseData.status == 201 || responseData.status == 202){
                console.log('[SMS SEND] [SUCCESS] - ' , responseData.status);
            }else{
                console.log('[SMS SEND] [FAIL] - ' , responseData.status, responseData.statusText);
            }

            
        }catch (exception) {
            console.log('[SMS SEND] [FAIL] - ' , exception);
        }finally{
            return responseData
        }

    }

    
}