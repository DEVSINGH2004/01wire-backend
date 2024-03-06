import {
  BadRequestException,
  ContextType,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { MESSAGES } from '@nestjs/core/constants';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const type = host.getType<ContextType>();

    switch (type) {
      case 'http':
        return this.catchHttp(exception, host);
    }
  }

  handleIfZodError(exception: unknown) {
    if (!(exception instanceof ZodError)) {
      return;
    }

    const statusCode = 400;
    const errorMessage = 'validation error';
    const errors = exception.errors.map((error) => error.message);
    const errorResponse = {
      statusCode,
      message: errorMessage,
      errors
    };
    throw new BadRequestException(errorResponse);
  }

  catchHttp(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    if (!req.logger) return super.catch(exception, host);
    req.logger.error(exception, undefined, 'HTTP');

    try {
      this.handleIfZodError(exception);
    } catch (e) {
      return super.catch(e, host);
    }
    if (exception instanceof HttpException) return super.catch(exception, host);
    const body = this.isHttpError(exception)
      ? {
          statusCode: exception.statusCode,
          message: exception.message
        }
      : {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: MESSAGES.UNKNOWN_EXCEPTION_MESSAGE
        };
    res.status(body.statusCode).json(body);
  }
}
