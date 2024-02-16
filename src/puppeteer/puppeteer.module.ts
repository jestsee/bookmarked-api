import { Module } from '@nestjs/common';
import { PuppeteerService } from './puppeteer.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [PuppeteerService],
  exports: [PuppeteerService],
  imports: [ConfigModule],
})
export class PuppeteerModule {}
