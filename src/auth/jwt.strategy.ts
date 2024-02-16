import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Request, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: `${process.env.JWT_TOKEN_SECRET}`,
    });
  }

  async validate(payload: any) {
    if (payload) {
      return { 
        userId: payload.userId,
        authority: payload.authority,
        authorityNm: payload.authorityNm,
        status: payload.status,
        organizationCd: payload.organizationCd,
        organizationName: payload.organizationName,
        userNm: payload.userNm,
     };
    } else {
      throw new UnauthorizedException('회원 정보 조회 실패');
    }
  }
}
