import { Module } from '@nestjs/common';
import { DataScraperController } from './data-scraper.controller';
import { TwitterModule } from 'src/twitter/twitter.module';

@Module({
  imports: [TwitterModule],
  controllers: [DataScraperController],
})
export class DataScraperModule {}
