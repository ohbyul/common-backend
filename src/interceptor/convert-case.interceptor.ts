import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import jsConvert from 'js-convert-case';

@Injectable()
export class ConvertCaseInterceptor implements NestInterceptor {
  private readonly logger = new Logger("Convert");

  intercept(context: ExecutionContext,next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    //Controller 가기 전 부분

    return next.handle()
    //Controller 실행되고 난 후 부분
    .pipe(
      map(data => {
        const http = context.switchToHttp();
        const request = http.getRequest();
        const response = http.getResponse();

        if(data.statusCode == 10000){
          const resultData = data.data
          
          if(resultData){
            const converted = jsConvert.camelKeys(data, { recursive: true , recursiveInArray: true , keepTypesOnRecursion: [Date]});
            data= converted
          }
        }
        
        return data;
        
      }),
    );
  }
}



