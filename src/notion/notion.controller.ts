import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { NotionService } from './notion.service';
import { GetTweetDataDto } from 'src/twitter/dto';
import { NotionIntegrationDto } from './dto';
import { HttpStatusCode } from 'axios';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

// @UseGuards(JwtGuard)
@Controller('notion')
export class NotionController {
  constructor(
    // TODO extract 'notion' as constant
    @InjectQueue('notion') private readonly notionQueue: Queue,
    private notionService: NotionService,
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
    const job = await this.notionQueue.add('notion-job', {
      ...dto,
      accessToken,
    });
    return { id: job.id };
  }

  @Get('bookmark-tweet/:taskId/progress')
  async checkProgress(@Param('taskId') taskId: string) {
    const job = await this.notionQueue.getJob(taskId);

    if (!job) return { status: 'not_found' };
    if (job.failedReason) return { status: 'failed' };
    if (job.finishedOn) return { status: 'completed' };

    return { status: 'on_progress' };
  }
}
