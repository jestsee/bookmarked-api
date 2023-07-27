import { Body, Controller, Post } from '@nestjs/common';
import { NotionService } from './notion.service';
import { NotionIntegrationDto } from './dto/notion-integration.dto';

@Controller('notion')
export class NotionController {
  constructor(private notionService: NotionService) {}

  @Post('integration')
  integration(@Body() dto: NotionIntegrationDto) {
    return this.notionService.getAccessToken(dto);
  }
}
