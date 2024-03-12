import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { NotionService } from './notion.service';
import { GetTweetDataDto } from 'src/twitter/dto';
import { NotionIntegrationDto } from './dto';
import { HttpStatusCode } from 'axios';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { MAP_JOB_STATUS, NOTION, NOTION_JOB } from './notion.constant';
import { RetryErrorInterceptor } from 'src/interceptor/retry-error.interceptor';
import { TwitterService } from 'src/twitter/twitter.service';

@Controller('notion')
export class NotionController {
  constructor(
    @InjectQueue(NOTION) private readonly notionQueue: Queue,
    private notionService: NotionService,
    private twitterService: TwitterService,
  ) {
    this.notionQueue.on('error', (err) => {
      // Log your error.
      console.log('error oi', err);
    });
  }

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
    let { url } = dto;
    const PROTOCOLS = 'https://';

    if (!url.includes(PROTOCOLS) && !url.includes('http://')) {
      url = PROTOCOLS + url;
    }

    const job = await this.notionQueue.add(NOTION_JOB, {
      ...dto,
      url,
      accessToken,
    });
    return { id: job.id };
  }

  @Get('bookmark-tweet/:taskId/status')
  async checkProgress(@Param('taskId') taskId: string) {
    const job = await this.notionQueue.getJob(taskId);

    if (!job) throw new NotFoundException('Task not found');

    const {
      failedReason,
      data: { type, url },
    } = job;

    const jobStatus = await job.getState();

    const status = MAP_JOB_STATUS[jobStatus] ?? MAP_JOB_STATUS.default;
    return {
      status,
      type,
      url,
      ...(failedReason && { message: failedReason }),
    };
  }

  @Patch('bookmark-tweet/:taskId/retry')
  @UseInterceptors(RetryErrorInterceptor)
  async tryAgain(@Param('taskId') taskId: string) {
    const job = await this.notionQueue.getJob(taskId);

    if (!job) throw new NotFoundException('Task not found');

    await job.retry();

    return { message: 'In the process of retrying' };
  }
}
