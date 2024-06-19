import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import type { UserTypeEnum } from '../user/enum/user.type.enum';

interface ITokenPayload {
  userType: UserTypeEnum;
  userId: string;
}

@Injectable()
export class JwtService {
  private _authSecret: string;

  constructor(private readonly configService: ConfigService) {
    this._authSecret = this.configService.get<string>('auth.jwtSecret');
  }

  signToken(payload: ITokenPayload): string {
    try {
      return jwt.sign(payload, this._authSecret, {
        expiresIn: '30d'
      });
    } catch (err) {
      throw new BadRequestException(`JWT: ${err.message}`);
    }
  }

  async verifyToken(token: string) {
    const secret = this._authSecret;
    return new Promise<ITokenPayload>((resolve, reject) => {
      return jwt.verify(token, secret, function (err, payload: any) {
        if (err?.name === 'TokenExpiredError')
          return reject(new BadRequestException('token expired'));
        if (err) return reject(new BadRequestException('invalid token'));
        if (!payload || typeof payload === 'string')
          return reject(new BadRequestException('unexpected payload'));
        return resolve(payload);
      });
    });
  }

  async refreshToken(token: string) {
    const secret = this._authSecret;
    token = token.replace(/^Bearer\s/, '');
    return new Promise<string>((resolve, reject) => {
      jwt.verify(token, secret, async (err, payload) => {
        if (err) return reject(new BadRequestException('invalid token'));
        if (!payload || typeof payload === 'string')
          return reject(new BadRequestException('unexpected payload'));

        const newToken = this.signToken({
          userId: payload.userId,
          userType: payload.userType
        });
        return resolve(newToken);
      });
    });
  }
}
