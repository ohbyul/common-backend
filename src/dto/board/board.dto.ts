import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SystemDto } from '../base/system.dto';


enum deleteYn {
  Y = 'Y',
  N = 'N'
}

export enum bbsKindCode {
  NOTICE = 'NOTICE',
  FAQ = 'FAQ',
}

//게시판 DTO
export class BoardDto extends SystemDto {

  @ApiProperty({ description: 'board id', required: false })
  id: string;

  @ApiProperty({ description: '게시판 종류', required: true })
  @IsEnum(bbsKindCode)
  bbsKindCd: string;

  @ApiProperty({ description: '게시글 제목', required: true })
  title: string;

  @ApiProperty({ description: '게시글 내용', required: true })
  contents: string;

  @ApiProperty({ enum: ['Y', 'N'], description: '삭제 여부', required: true, default: 'N' })
  @IsEnum(deleteYn)
  deleteYn: string;

  @ApiProperty({ description: '파일 리스트', required: false })
  files?: Express.Multer.File[];
}
