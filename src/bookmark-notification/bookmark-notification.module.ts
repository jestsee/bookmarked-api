import { Module } from '@nestjs/common';
import { BookmarkNotificationService } from './bookmark-notification.service';

@Module({
  exports: [BookmarkNotificationService],
  providers: [BookmarkNotificationService],
})
export class BookmarkNotificationModule {}
