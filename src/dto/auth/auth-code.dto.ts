import { ApiProperty } from '@nestjs/swagger';

//본인인증 DTO
export class AuthCodeDto {
  @ApiProperty({ description: '사용자 아이디' })
  userId: number;

  @ApiProperty({ description: '휴대폰 번호'})
  mobileNo: string;

  @ApiProperty({ description: '아이디 인증번호' })
  authEmailNo: string;

  @ApiProperty({ description: '휴대폰 인증번호' })
  authMobileNo: string;

  @ApiProperty({ description: '인증 타입' })
  authType: string;
}
