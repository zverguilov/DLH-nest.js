import { ExceptionFilter, Catch, HttpException, ArgumentsHost } from '@nestjs/common';
import { CustomException } from '../exception/custom-exception';
import { Response, Request } from 'express';

@Catch(CustomException)
export class ErrorFilter implements ExceptionFilter {
  public catch(exception: CustomException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    response.status(exception.statusCode || 500)
    
    response.json({
      statusCode: exception.statusCode || 500,
      message: exception.message,
    });
  }
}
