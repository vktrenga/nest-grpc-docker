import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
      let errors = undefined;

      // Log the full exception for debugging
      // eslint-disable-next-line no-console
      console.error('Exception caught by HttpExceptionFilter:', exception);

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res && (res as any).statusCode === 400) {
        status = 400;
        message = (res as any).message || 'Validation failed';
        errors = (res as any).errors;
      } else {
        status = exception.getStatus();
        message = typeof res === 'string' ? res : (res as any).message || message;
      }
    }

    response.status(status).json({
      status: status === 400 ? 'validation error' : 'error',
      message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}