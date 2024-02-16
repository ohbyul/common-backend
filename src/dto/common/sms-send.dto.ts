import { ApiProperty } from '@nestjs/swagger';

//sms 발송 DTO
export class SMSSendDto {
  @ApiProperty({ description: '(SMS | LMS | MMS)', required: true })
  SMSType: string;
  
  @ApiProperty({ description: '발신처', required: true })
  smsSenderNo: string;

  @ApiProperty({ description: '수신처', required: true })
  receiveNo: string;

  @ApiProperty({ description: '제목 (LMS 인경우만)'})
  subject: string;

  @ApiProperty({ description: '메세지 내용', required: true })
  content: string;

}
