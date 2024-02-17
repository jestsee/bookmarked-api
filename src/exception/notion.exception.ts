import { HttpException } from '@nestjs/common';
import { APIResponseError } from '@notionhq/client';

export class NotionException extends HttpException {
  constructor(notionException: APIResponseError) {
    super(notionException.message, notionException.status);
  }
}
