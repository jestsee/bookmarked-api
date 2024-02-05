import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { APIResponseError } from '@notionhq/client';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotionException } from 'src/exception/notion.exception';

@Injectable()
export class NotionSDKErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) =>
        throwError(() => {
          if (error instanceof APIResponseError) {
            return new NotionException(error);
          }
          return error;
        }),
      ),
    );
  }
}
