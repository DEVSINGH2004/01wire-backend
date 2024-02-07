import { NextFunction, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import Logger from '.';
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = request;
    const fields = {
      requestId: request.header('x-request-id') ?? uuid(),
      ip: request.header('x-host') ?? ip,
      userAgent: request.header('x-user-agent') ?? request.get('user-agent'),
      uid: request.header('x-uid') ?? null,
      method,
      body: request.body,
      originalUrl,
      query: request.query
    };

    const logger = Logger.createInstance('HTTP');
    logger.fields = fields;
    request.logger = logger;
    logger.log('Request started');

    response.on('finish', () => {
      const { statusCode } = response;
      logger.fields['respCode'] = statusCode;
      logger.log('Request finished');
    });

    next();
  }
}
