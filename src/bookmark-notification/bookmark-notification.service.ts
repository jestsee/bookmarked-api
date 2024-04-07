import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TweetData } from 'src/twitter/interface';
import { BOOKMARK_EVENT } from './bookmark-notification.constant';
import { filter, fromEvent, map, takeWhile } from 'rxjs';

@Injectable()
export class BookmarkNotificationService {
  constructor(private eventEmitter: EventEmitter2) {}

  emitTweetScraped(data: TweetData, length: number, id: string) {
    const { name, username, url, text } = data;
    this.eventEmitter.emit(BOOKMARK_EVENT, {
      data: { id, name, username, url, length, text },
    });
  }

  emitAllTweetScraped(id: string) {
    this.eventEmitter.emit(BOOKMARK_EVENT, {
      data: { id, message: 'All tweets scraped' },
    });
  }

  emitSentToNotion(id: string) {
    this.eventEmitter.emit(BOOKMARK_EVENT, {
      data: { id, message: 'Tweets successfully sent to Notion' },
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
        // TODO implement catchError instead?
        if (data.error) throw new BadRequestException(data.error);
        return { data };
      }),
    );
  }
}
