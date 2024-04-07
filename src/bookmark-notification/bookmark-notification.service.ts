import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TweetData } from 'src/twitter/interface';
import { BOOKMARK_EVENT } from './bookmark-notification.constant';
import { fromEvent, map, takeWhile } from 'rxjs';

@Injectable()
export class BookmarkNotificationService {
  constructor(private eventEmitter: EventEmitter2) {}

  emitTweetScraped(data: TweetData, length: number) {
    const { name, username, url, text } = data;
    this.eventEmitter.emit(BOOKMARK_EVENT, {
      data: { name, username, url, length, text },
    });
  }

  emitCompleted() {
    this.eventEmitter.emit(BOOKMARK_EVENT, { data: { isCompleted: true } });
  }

  emitError(error) {
    this.eventEmitter.emit(BOOKMARK_EVENT, { data: { error } });
  }

  subscribe() {
    return fromEvent(this.eventEmitter, BOOKMARK_EVENT).pipe(
      // combineLatest([interval(3000)]),
      takeWhile(({ data }) => !data.isCompleted),
      map(({ data }) => {
        // TODO implement catchError instead?
        if (data.error) throw new BadRequestException(data.error);
        return { data };
      }),
    );
  }
}
