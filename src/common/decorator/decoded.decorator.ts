import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Decoded = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.decoded && request.decoded[data] : request.decoded;
  }
);
