import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { NotionService } from './notion.service';
import { NotionIntegrationDto } from './dto/notion-integration.dto';
import { JwtGuard } from 'src/auth/guards';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { HttpStatusCode } from 'axios';

@UseGuards(JwtGuard)
@Controller('notion')
export class NotionController {
  constructor(private notionService: NotionService) {}

  @HttpCode(HttpStatusCode.Ok)
  @Post('integration')
  integration(@Body() dto: NotionIntegrationDto, @GetUser() user: User) {
    console.log({ hai: user });
    return this.notionService.getAccessToken(dto, user);
  }
}
