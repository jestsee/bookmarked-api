import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TweetData } from 'src/twitter/interface';
import { BOOKMARK_EVENT, STATUS } from './bookmark-notification.constant';
import { filter, fromEvent, map, takeWhile, throwError, timeout } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BookmarkNotificationService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly config: ConfigService,
  ) {}

  emitTweetScraped(data: TweetData, length: number, id: string) {
    const { name, username, url, text } = data;
    this.eventEmitter.emit(BOOKMARK_EVENT, {
      data: { id, name, username, url, length, text, status: STATUS.SCRAPING },
    });
  }

  emitAllTweetScraped(id: string) {
    this.eventEmitter.emit(BOOKMARK_EVENT, {
      data: { id, message: 'All tweets scraped', status: STATUS.SCRAPED },
    });
  }

  emitSentToNotion(id: string, notionPageUrl: string) {
    this.eventEmitter.emit(BOOKMARK_EVENT, {
      data: {
        id,
        notionPageUrl,
        message: 'Tweets successfully sent to Notion',
        status: STATUS.BOOKMARKED,
      },
    });
  }

  emitCompleted(id: string) {
    this.eventEmitter.emit(BOOKMARK_EVENT, { data: { id, isCompleted: true } });
  }

  emitError(error: any, id: string) {
    this.eventEmitter.emit(BOOKMARK_EVENT, { data: { id, error } });
  }

  subscribe(id: string) {
    return fromEvent(this.eventEmitter, BOOKMARK_EVENT).pipe(
      filter(({ data }) => data.id === id),
      takeWhile(({ data }) => !data.isCompleted),
      map(({ data }) => {
        if (data.error) throw new BadRequestException(data.error);
        return { data };
      }),
      timeout({
        each: this.config.get('SSR_TIMEOUT') ?? 15000,
        with: () =>
          throwError(() => new BadRequestException('Connection timed out')),
      }),
    );
  }
}
