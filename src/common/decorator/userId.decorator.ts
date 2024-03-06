import { JwtPayload, verify } from 'jsonwebtoken';
import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common';
import { Request } from 'express';
const JWT_SECRET = process.env.AUTH_JWT_SECRET;

const getToken = (authToken: string): string => {
  const match = authToken.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw new UnauthorizedException();
  }
  return match[1];
};

export const UserId = createParamDecorator(async (_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const token = getToken(request.headers.authorization);
  if (!token) return;
  if (typeof token !== 'string') {
    throw new BadRequestException('invalid token');
  }
  const decoded = await new Promise<JwtPayload>((resolve, reject) => {
    verify(token, JWT_SECRET, (err, decoded: JwtPayload) => {
      if (err || !decoded) return reject(new UnauthorizedException());
      resolve(decoded);
    });
  });
  return decoded.userId;
});
