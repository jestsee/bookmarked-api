import { Module } from '@nestjs/common';
import { PuppeteerController } from './puppeteer.controller';
import { PuppeteerService } from './puppeteer.service';

@Module({
  controllers: [PuppeteerController],
  providers: [PuppeteerService],
})
export class PuppeteerModule {}
