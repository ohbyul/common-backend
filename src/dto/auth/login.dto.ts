import { ApiProperty } from '@nestjs/swagger';

//로그인 DTO
export class LoginDto {
  @ApiProperty({ description: '회원 계정', required : true })
  userId: string;

  @ApiProperty({ description: '회원 패스워드', required : true })
  userPwd: string;

  @ApiProperty({ description: '브라우저 정보', required : false })
  userAgent: string;

  @ApiProperty({ description: 'clientIP', required : false })
  ip: string;

  @ApiProperty({ description: '자동 로그인', required : false })
  autoLogin: boolean;

  
}
