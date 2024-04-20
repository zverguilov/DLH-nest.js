import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class RemoveUnderscoreInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (typeof data === 'object') {
          return this.cleanKeys(data);
        }
        return data;
      })
    );
  }

  private cleanKeys(obj: any): any {
    return JSON.parse(JSON.stringify(obj).replace(/__/g, ''));
  }
}