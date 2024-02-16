import { ApiProperty } from '@nestjs/swagger';

//사용자 비밀번호 변경 DTO
export class PwdChangeDto {
  @ApiProperty({ description: '사용자 아이디', required : true })
  userId: string;

  @ApiProperty({ description: '새 비밀번호', required : true })
  userPwd: string;

  @ApiProperty({ description: '비밀번호 확인', required : true })
  userPwdChk: string;
  
}
