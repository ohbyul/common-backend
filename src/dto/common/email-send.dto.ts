import { ApiProperty } from '@nestjs/swagger';

//email 발송 DTO
export class EmailSendDto {

  @ApiProperty({ description: '발송자Email', required: true })
  senderAddress: string;

  @ApiProperty({ description: '발송자 이름', required: true })
  senderName: string;

  @ApiProperty({ description: '메일 제목', required: true })
  title: string;

  @ApiProperty({ description: '메일 내용 (500K)', required: true })
  body: string;

  // @ApiProperty({ description: '기본 수신 거부 문구 사용 여부'})
  // useBasicUnsubscribeMsg: boolean = false;
  
  // @ApiProperty({ description: '사용자 정의 수신 거부 문구'})
  // unsubscribeMessage: string;

  @ApiProperty({ description: '수신자 Email 주소', required: true })
  address: string;

  @ApiProperty({ description: '수신자 이름', required: true })
  name: string;


  
}
