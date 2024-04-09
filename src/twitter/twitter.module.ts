import { Module } from '@nestjs/common';
import { TwitterService } from './twitter.service';
import { PuppeteerModule } from 'src/puppeteer/puppeteer.module';
import { BookmarkNotificationModule } from 'src/bookmark-notification/bookmark-notification.module';

@Module({
  imports: [PuppeteerModule, BookmarkNotificationModule],
  providers: [TwitterService],
  exports: [TwitterService],
})
export class TwitterModule {}
