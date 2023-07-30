import { Body, Controller, Get } from '@nestjs/common';
import { GetTweetDataDto } from 'src/twitter/dto';
import { TwitterService } from 'src/twitter/twitter.service';

@Controller('data-scraper')
export class DataScraperController {
  constructor(private scraperService: TwitterService) {}

  @Get('twitter')
  getTwitterData(@Body() dto: GetTweetDataDto) {
    return this.scraperService.getTwitterData(dto.url, dto.type);
  }
}
