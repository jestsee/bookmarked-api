import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NotionService } from './notion.service';
import { NotionIntegrationDto } from './dto/notion-integration.dto';
import { JwtGuard } from 'src/auth/guards';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { HttpStatusCode } from 'axios';
import { TwitterService } from 'src/twitter/twitter.service';
import { GetTweetDataDto } from 'src/twitter/dto';
import { TweetData } from 'src/twitter/interface';

@UseGuards(JwtGuard)
@Controller('notion')
export class NotionController {
  constructor(
    private notionService: NotionService,
    private twitterService: TwitterService,
  ) {}

  @HttpCode(HttpStatusCode.Ok)
  @Post('integration')
  integration(@Body() dto: NotionIntegrationDto, @GetUser() user: User) {
    return this.notionService.getAccessToken(dto, user);
  }

  @Get('databases')
  getDatabases(@GetUser() user: User) {
    return this.notionService.connectToDatabase(user);
  }

  @Post('bookmark-tweet')
  async bookmarkTweet(@GetUser() user: User, @Body() dto: GetTweetDataDto) {
    const tweets = await this.twitterService.getTwitterData(dto.url, dto.type);
    return this.notionService.createPage(user, tweets as TweetData[]);
  }

  // @HttpCode(HttpStatusCode.Ok)
  // @Post('create-page')
  // createPage(@GetUser() user: User) {
  //   return this.notionService.createPage(user);
  // }
}
