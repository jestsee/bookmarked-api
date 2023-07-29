import { Body, Controller, Get } from '@nestjs/common';
import { PuppeteerService } from './puppeteer.service';
import { PuppeteerDto } from './dto';

@Controller('puppeteer')
export class PuppeteerController {
  constructor(private puppeteerService: PuppeteerService) {}

  @Get()
  getData(@Body() dto: PuppeteerDto) {
    return this.puppeteerService.getTwitterData(dto.url);
  }
}
