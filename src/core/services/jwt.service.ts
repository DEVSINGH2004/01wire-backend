import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  private _authSecret: string;

  constructor(private readonly configService: ConfigService) {
    this._authSecret = this.configService.get<string>('auth.jwtSecret');
  }

  signToken(payload: Record<any, any>): string {
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
    return new Promise((resolve, reject) => {
      return jwt.verify(token, secret, function (err, payload: any) {
        if (err?.name === 'TokenExpiredError')
          return reject(new BadRequestException('Token expired'));
        if (err) return reject(new BadRequestException('Invalid token'));
        if (!payload || typeof payload === 'string')
          return reject(new BadRequestException('Unexpected payload'));
        return resolve(payload);
      });
    });
  }

  async refreshToken(token: string) {
    const secret = this._authSecret;
    token = token.replace(/^Bearer\s/, '');
    return new Promise<string>((resolve, reject) => {
      jwt.verify(token, secret, async (err, payload) => {
        if (err) return reject(new BadRequestException('Invalid token'));
        if (!payload || typeof payload === 'string')
          return reject(new BadRequestException('Unexpected payload'));

        const newToken = await this.signToken({
          userId: payload.userId,
          userType: payload.userType
        });
        return resolve(newToken);
      });
    });
  }
}
