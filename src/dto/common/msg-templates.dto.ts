import { ApiProperty } from '@nestjs/swagger';

//메세지 템플릿 DTO
export class MSGTemplatesDto {

  @ApiProperty({ description: 'id', required: true })
  id: number;

  @ApiProperty({ description: '메세지 구분', required: true })
  msgTypeCd: string;

  @ApiProperty({ description: '업무구분', required: true })
  taskTypeCd: string;

  @ApiProperty({ description: '메세지 제목', required: true })
  title: string;

  @ApiProperty({ description: '발송자명' })
  senderNm: string;

  @ApiProperty({ description: '발송자', required: true })
  sender: string;

  @ApiProperty({ description: '메세지 내용' })
  contents: string;

  @ApiProperty({ description: '이메일 양식 파일명'})
  fileNm: string;

  @ApiProperty({ description: '이메일 양식 위치' })
  filePath: string;
  
}
