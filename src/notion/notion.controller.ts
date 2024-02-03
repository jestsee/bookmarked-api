import { Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';
import { NotionService } from './notion.service';
import { TwitterService } from 'src/twitter/twitter.service';
import { GetTweetDataDto } from 'src/twitter/dto';
import { NotionIntegrationDto } from './dto';
import { HttpStatusCode } from 'axios';

// @UseGuards(JwtGuard)
@Controller('notion')
export class NotionController {
  constructor(
    private notionService: NotionService,
    private twitterService: TwitterService,
  ) {}

  @HttpCode(HttpStatusCode.Ok)
  @Post('generate-access-token')
  integration(@Body() dto: NotionIntegrationDto) {
    return this.notionService.getAccessToken(dto);
  }

  // fetch first database
  @Get('database')
  getDatabases(@Headers('access-token') accessToken: string) {
    return this.notionService.getDatabase(accessToken);
  }

  @Post('bookmark-tweet')
  async bookmarkTweet(
    @Headers('access-token') accessToken: string,
    @Body() dto: GetTweetDataDto,
  ) {
    const tweets = await this.twitterService.getTwitterData(dto.url, dto.type);
    return this.notionService.createPage(
      accessToken,
      dto.databaseId,
      tweets,
      dto.tags,
    );
  }
}
