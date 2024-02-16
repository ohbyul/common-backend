import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Props } from '../sample/props.dto';

enum GenderCode {
    M = 'M',
    F = 'F'
}

//회원가입 DTO
class Join {
    @ApiProperty({ description: '사용자 아이디', required: true })
    userId: string;

    @ApiProperty({ description: '사용자 패스워드', required: true })
    userPwd: string;

    @ApiProperty({ description: '사업자번호', required: false })
    organizationCd: number;

    @ApiProperty({ description: '사용자명', required: true })
    userNm: string;

    @ApiProperty({ enum: ['M', 'F'], description: '성별', required: true })
    @IsEnum(GenderCode)
    gender: string;

    @ApiProperty({ description: '이용약관 동의여부', required: false })
    agreementYn: boolean;

}

export type JoinDto = Props<Join>

