import { HttpStatus, HttpException } from '@nestjs/common';

export class CustomException extends HttpException {
    public constructor(message: string, public statusCode: number) {
        super(message, statusCode);
      }
    }
    