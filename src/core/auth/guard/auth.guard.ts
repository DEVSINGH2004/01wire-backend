// jwt-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthTypeEnum } from 'src/common/enum/auth.enum';
import { JwtService } from '../../services/jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const userType = this.reflector.get<AuthTypeEnum>(
      'authType',
      context.getHandler()
    );

    if (userType === undefined) return true;

    const req = context.switchToHttp().getRequest();
    const bearer = req.headers?.authorization;
    if (!bearer) throw new UnauthorizedException('token not provided');
    const token = this.getToken(req.headers?.authorization);
    try {
      const decoded: any = await this.jwtService.verifyToken(token);

      if (userType !== AuthTypeEnum.PRIVATE && decoded.tokenType !== userType) {
        throw new UnauthorizedException('invalid token');
      }
      req.decoded = decoded;
    } catch (err) {
      throw new UnauthorizedException('invalid token');
    }

    return true;
  }

  private getToken = (authToken: string): string => {
    const match = authToken.match(/^Bearer (.*)$/);
    if (!match || match.length < 2) {
      throw new HttpException(
        { message: 'UNAUTHORIZED' },
        HttpStatus.UNAUTHORIZED
      );
    }
    return match[1];
  };
}
