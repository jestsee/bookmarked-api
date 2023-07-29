import { Body, Controller, Get } from '@nestjs/common';
import { PuppeteerDto } from 'src/puppeteer/dto';
import { TwitterService } from 'src/twitter/twitter.service';

@Controller('data-scraper')
export class DataScraperController {
  constructor(private scraperService: TwitterService) {}

  @Get('twitter')
  getTwitterData(@Body() dto: PuppeteerDto) {
    return this.scraperService.getTwitterData(dto.url);
  }
}
