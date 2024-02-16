import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// import { UserTracking } from '../lib/user-tracking';
@Injectable()
export class TrackingInterceptor implements NestInterceptor {
  // constructor(private userTracking UserTracking){}
  private readonly logger = new Logger("TrackingInterceptor");

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    //Controller 가기 전 부분
    // this.logger.log(context.switchToHttp().getRequest().originalUrl)

    return next.handle()
      //Controller 실행되고 난 후 부분
      .pipe(
        map(data => {
          const http = context.switchToHttp();
          const request = http.getRequest();
          const response = http.getResponse();
          if (data.statusCode == 10000) {
            this.logger.debug(request.originalUrl)
          }


          if (request.originalUrl.includes("api/external")) {
            this.logger.log(request.originalUrl)
            this.logger.log(`   request body         =======> ${JSON.stringify(request.body)}`);
            this.logger.log(`   response body         =======> ${JSON.stringify(data)}`);
          }

          return data;
        }),
      );
  }
}