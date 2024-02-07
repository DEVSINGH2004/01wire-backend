import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException
} from '@nestjs/common';

@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(exception, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    // Handle and format the exception here
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    response.status(status).json({
      message: exception.message || 'Internal server error'
    });
  }
}
