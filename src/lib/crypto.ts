import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js'
//npm i crypto-js 
// Typescript에서 사용시 추가 설치
// npm i --save-dev @types/crypto-js
@Injectable()
export class  Crypto {

    private secretKey : string = process.env.AES_SECRETKEY;
    private ncpAccesskey = process.env['NCP_ACCESS_KEY'];
    private ncpSecretkey = process.env['NCP_SECRET_KEY'];


    constructor() {}
    
    async getDecrypto(text:string)  {
        
        var bytes = CryptoJS.AES.decrypt(text, this.secretKey);
        var decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        
        return decrypted;
    }

    async getEncrypto(text:string)  {
        
        var encrypted = CryptoJS.AES.encrypt(text, this.secretKey);
        let result = encrypted.toString()

        return encodeURIComponent(result)
    }

    /*************************************************
     * NCP API 호출시 사용되는  signature 생성
     * 
     * @returns signature
    ************************************************/
    async makeSignature(timestamp : number, method : string, uri : string) : Promise<string> {
        const space = " ";				// one space
        const newLine = "\n";				// new line
    
        const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, this.ncpSecretkey);
        hmac.update(method);
        hmac.update(space);
        hmac.update(uri);
        hmac.update(newLine);
        hmac.update(timestamp.toString());
        hmac.update(newLine);
        hmac.update(this.ncpAccesskey);
    
        const hash = hmac.finalize();

        let signature = hash.toString(CryptoJS.enc.Base64);
    
        return signature;
    }

}
