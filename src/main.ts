import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TrackingInterceptor } from './interceptor/user-tracking.interceptor';
import { urlencoded, json } from 'body-parser';
import { ConvertCaseInterceptor } from './interceptor/convert-case.interceptor';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV == null ? ['debug'] : process.env.NODE_ENV === 'dev' ? ['debug'] : ['log']
  });

  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,                //DTO에 없는 값은 거르고 에러메세지 출력
  //     forbidNonWhitelisted: true,     //DTO에 존재하지않는 값이 들어오면 에러메세지출력
  //     transform: true,                //DTO에 설정 타입은 striing이지만 number로 타입 변형 가능하게 설정
  //   }),
  // );

  //인터셉터 전역 선언
  app.useGlobalInterceptors(new TrackingInterceptor());
  app.useGlobalInterceptors(new ConvertCaseInterceptor());

  //PayloadTooLargeError 용량 키움
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  app.enableCors();
  const config = new DocumentBuilder()
    .setTitle('common API Swagger')
    .setDescription('common API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.SERVER_PORT);
}
bootstrap();
