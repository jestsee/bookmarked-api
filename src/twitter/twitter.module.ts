import { Module } from '@nestjs/common';
import { TwitterService } from './twitter.service';
import { PuppeteerModule } from 'src/puppeteer/puppeteer.module';

@Module({
  imports: [PuppeteerModule],
  providers: [TwitterService],
  exports: [TwitterService],
})
export class TwitterModule {}
