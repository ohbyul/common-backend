import { ExceptionFilter, Catch, ArgumentsHost, HttpException,  HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter  implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    private readonly logger = new Logger("AllExceptionsFilter");
    
    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();

        const { httpAdapter } = this.httpAdapterHost;
        
        const httpStatus = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionRes: any = exception instanceof HttpException ? exception.getResponse() : null ;

        let responseBody = null

        this.logger.error(exception)

        if(exceptionRes){
            const exceptionCode = `error` + exceptionRes.statusCode;
            let exceptionMessage = process.env[exceptionCode];
            if(exceptionMessage == undefined) exceptionMessage = exceptionRes.message

            const exceptionArgs = exceptionRes.args;
            const argsLength = exceptionArgs? exceptionArgs.length : 0;
            for (var i = 0; i < argsLength; i++) {
                exceptionMessage = exceptionMessage?.replace('args' + i, exceptionArgs[i]);
            }

            responseBody = {
                timestamp: new Date().toISOString(),
                path: request.url,
                statusCode: exceptionRes.statusCode,
                message: exceptionMessage,
                data: exceptionRes.data
              };
        }else{
            responseBody = {
                timestamp: new Date().toISOString(),
                path: request.url,
                statusCode: 50000,
                message: "오류가 발생하였습니다. 관리자에 문의하세요",
                data: null
              };
        }

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);

    }
}