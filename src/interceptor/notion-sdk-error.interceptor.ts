import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  HttpException,
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
          console.error('[ERROR]', error);
          if (error instanceof APIResponseError) {
            return new NotionException(error);
          }

          if (error instanceof HttpException) {
            return error;
          }

          return new BadRequestException(
            error.response?.data?.error_description ?? 'Something went wrong',
          );
        }),
      ),
    );
  }
}
