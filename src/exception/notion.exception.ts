import { HttpException } from '@nestjs/common';
import { APIResponseError } from '@notionhq/client';

interface ErrorResponse {
  response: {
    message: string;
    error: string;
    statusCode: number;
  };
  status: number;
}

export class NotionException extends HttpException {
  constructor(notionException: APIResponseError | ErrorResponse) {
    if (notionException instanceof APIResponseError) {
      super(notionException.message, notionException.status);
      return;
    }
    super(
      notionException.response.message,
      notionException.response.statusCode,
    );
  }
}
