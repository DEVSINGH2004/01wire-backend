import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  ForbiddenException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '../../services/jwt.service';
import type { UserTypeEnum } from 'src/core/user/enum/user.type.enum';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const userType = this.reflector.get<UserTypeEnum>(
      'userType',
      context.getHandler()
    );

    if (userType === undefined) return true;

    const req = context.switchToHttp().getRequest();
    const bearer = req.headers?.authorization;
    if (!bearer) throw new UnauthorizedException('token not provided');
    const token = this.getToken(req.headers?.authorization);
    const decoded = await this.jwtService.verifyToken(token);

    if (decoded.userType !== userType) {
      throw new ForbiddenException();
    }
    req.decoded = decoded;
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
