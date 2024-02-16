import { Injectable } from '@nestjs/common';
import { ReqRes } from './req-res';
import moment from 'moment';
import { URLSearchParams } from 'url';

@Injectable()
export class PublicApi {

    private governmentApiUrl = process.env['GOVERNMENT_API_URL'];
    private accesskey = process.env['GOVERNMENT_SECRET_KEY'];
    private decodeAccesskey = process.env['GOVERNMENT_DECODE_SECRET_KEY'];

    private serviceOperationHoliday = process.env['SERVICE_OPERATION_NATIONAL_HOLIDAY'];
    private serviceOperationRestday = process.env['SERVICE_OPERATION_NATIONAL_RESTDAY'];
    private serviceOperationAnniverary = process.env['SERVICE_OPERATION_NATIONAL_ANNIVERSARY'];
    private serviceOperation24divisions = process.env['SERVICE_OPERATION_NATIONAL_24DIVISIONS'];
    private serviceOperationSundryday = process.env['SERVICE_OPERATION_NATIONAL_SUNDRYDAY'];

    constructor(
        private reqRes:ReqRes,
    ) {
    }
 
    async getPublicHoliday(params : any){
        let {props , transaction} = params
        let { year , month } = props
        let responseData;

        try{
            let url : string = this.governmentApiUrl.replace('{serviceOperation}',this.serviceOperationHoliday);
            const method : string = 'GET'
            const secretKey = this.accesskey
            const decodeSecretKey = this.decodeAccesskey
            
            let header: object = {
                'Content-Type': 'application/json',
            };

            let params = new URLSearchParams()
            params.set('ServiceKey' , decodeSecretKey)
            params.set('solYear' , year)
            if(month){
                params.set('solMonth' , month)
            }
            params.set('numOfRows' , '100')

            url = url + '?' + params.toString()
            let body: object = {
                
            }

            responseData = await this.reqRes.requestMethod({
                method,
                url,
                header,
                body
            });
        }catch (exception) {
            console.log('[GET Holiday] [FAIL] - ' , exception);
        }finally{
            return responseData
        }
        
    }
}