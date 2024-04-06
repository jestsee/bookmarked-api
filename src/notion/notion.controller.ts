import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Sse,
  UseInterceptors,
} from '@nestjs/common';
import { NotionService } from './notion.service';
import { GetTweetDataDto } from 'src/twitter/dto';
import { NotionIntegrationDto } from './dto';
import { HttpStatusCode } from 'axios';
import { RetryErrorInterceptor } from 'src/interceptor/retry-error.interceptor';
import { interval, map, Observable } from 'rxjs';

@Controller('notion')
export class NotionController {
  constructor(private notionService: NotionService) {}

  @HttpCode(HttpStatusCode.Ok)
  @Post('generate-access-token')
  integration(@Body() dto: NotionIntegrationDto) {
    return this.notionService.getAccessToken(dto);
  }

  // fetch first database only
  @Get('database')
  getDatabases(@Headers('access-token') accessToken: string) {
    return this.notionService.getDatabase(accessToken);
  }

  @Post('bookmark-tweet')
  bookmarkTweet(
    @Headers('access-token') accessToken: string,
    @Body() dto: GetTweetDataDto,
  ) {
    return this.notionService.bookmarkTweet(accessToken, dto);
  }

  @Get('bookmark-tweet/:taskId/status')
  checkProgress(@Param('taskId') taskId: string) {
    return this.notionService.checkProgress(taskId);
  }

  @Sse('sse')
  sse(): Observable<{ data: { hello: string } }> {
    return interval(10).pipe(map((x) => ({ data: { hello: 'world' + x } })));
  }

  @Patch('bookmark-tweet/:taskId/retry')
  @UseInterceptors(RetryErrorInterceptor)
  retry(@Param('taskId') taskId: string) {
    return this.notionService.retry(taskId);
  }
}
