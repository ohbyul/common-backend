import request = require('request');
import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ReqRes } from './req-res';
import moment from "moment-timezone";
import { EmailSendDto } from 'src/dto/common/email-send.dto';
import { Crypto } from './crypto';

@Injectable()
export class EmailSender {

    private ncpAccesskey = process.env['NCP_ACCESS_KEY'];
    private emailSendUrl = process.env['NCP_EMAIL_SEND_URL'];
    private emailSendUri = process.env['NCP_EMAIL_SEND_URI'];

    constructor(
        private reqRes:ReqRes,
        private crypto:Crypto
    ) {       
    }

    async sendEmail(emailSendDto:EmailSendDto){
        let responseData;

        try{

            const timestamp : number = moment.tz("Asia/Seoul").valueOf()
            const url : string = this.emailSendUrl
            const uri : string = this.emailSendUri;
            const method : string = 'POST'
            const signature = await this.crypto.makeSignature(timestamp, method , uri)

            let header: object = {
                'Content-Type': 'application/json; charset=utf-8',
                'x-ncp-apigw-timestamp': timestamp,
                'x-ncp-iam-access-key': this.ncpAccesskey,
                'x-ncp-apigw-signature-v2': signature,
                'x-ncp-lang': 'ko-KR'
            };

            let body: object = {
                'senderAddress': emailSendDto.senderAddress,           // 발송자Email
                'senderName': emailSendDto.senderName,      // 발송자 이름
                'title': emailSendDto.title,        // 메일 제목
                'body': emailSendDto.body,    // 메일 내용 (500K)
                // 'useBasicUnsubscribeMsg': emailSendDto.useBasicUnsubscribeMsg,        // 기본 수신 거부 문구 사용 여부
                // 'unsubscribeMessage': emailSendDto.unsubscribeMessage,        // 사용자 정의 수신 거부 문구
                'recipients':[
                    {
                        'address': emailSendDto.address,    // 수신자 Email 주소
                        'name': emailSendDto.name,    // 수신자 이름
                        'type': 'R'     // 수신자 유형 R: 수신자, C: 참조인, B: 숨은참조
                    }
                ],
                'individual' : true,    //개인별 발송 혹은 일반 발송 여부
                'advertising' : false    //광고메일여부
            } 
            
            responseData = await this.reqRes.requestMethod({
              method,
              url,
              header,
              body
            });

            if(responseData.status == 200 || responseData.status == 201 || responseData.status == 202){
                console.log('[EMAIL SEND] [SUCCESS] - ' , responseData.status);
            }else{
                console.log('[EMAIL SEND] [FAIL] - ' , responseData.status, responseData.statusText);
            }

            
        }catch (exception) {
            console.log('[EMAIL SEND] [FAIL] - ' , exception);
        }finally{
            return responseData
        }

    }

    
}