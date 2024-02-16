import request = require('request');
import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { resolve } from 'path';
import  https  from 'https';

@Injectable()
export class ReqRes {
  constructor() {}

  // [ get / post / put / delete ]
  async requestMethod(params : any) {
    let { method , url , header , body } = params
    
    const sendHeader = JSON.parse( JSON.stringify(header));
    const sendData = JSON.parse(JSON.stringify(body));
    
    return new Promise((resolve) =>
      axios({
        method: method,
        url: url,
        headers: sendHeader,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false, //허가되지 않은 인증을 reject하지 않겠다!
        }),
        data: sendData,
      })
      .then(function (res) {
        resolve(res);
      })
      .catch(function (error) {
        resolve(error.response);
      })
    );
  }
  

}
