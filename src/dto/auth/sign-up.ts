import { ApiProperty } from '@nestjs/swagger';

//회원가입 DTO
export class SignUpDto {
  @ApiProperty({ description: '회원 이름' })
  username: string;

  @ApiProperty({ description: '회원 이메일 주소' })
  userEmail: string;

  @ApiProperty({ description: '회원 패스워드' })
  password: string;

  @ApiProperty({ description: '회원 패스워드 확인' })
  password2: string;

  @ApiProperty({ description: '회원 전화번호' })
  phoneNumber: string;

  @ApiProperty({ description: '회원 약관 동의 여부 0 => 비동의, 1 => 동의' })
  acceptTerms: number;

  @ApiProperty({
    description: '개인 정보 제공 동의 여부 0 => 비동의, 1 => 동의',
  })
  acceptPrivacy: number;

  @ApiProperty({ description: '회원 탈퇴 여부 0 => Yuji, 1 => 탈퇴' })
  isQuit: number;

  @ApiProperty({ description: '회원 탈퇴일' })
  quitedAt: Date;

  @ApiProperty({
    description: '이메일 컨펌 여부 0 => 컨펌 하지 않음, 1 => 컨펌 함',
  })
  isEmailConfirm: number;
}
