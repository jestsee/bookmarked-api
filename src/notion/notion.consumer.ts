import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { TwitterService } from 'src/twitter/twitter.service';
import { NotionService } from './notion.service';
import { NOTION, NOTION_JOB } from './notion.constant';
import { BadRequestException } from '@nestjs/common';
import { NotionJobPayload } from './interface';

type JobPayload = Job<Omit<NotionJobPayload, 'tags'> & { tags?: string[] }>;

@Processor(NOTION)
export class NotionConsumer {
  constructor(
    private notionService: NotionService,
    private twitterService: TwitterService,
  ) {}

  @Process({ name: NOTION_JOB, concurrency: 4 })
  async bookmarkTweet(job: JobPayload) {
    const { type, url, id } = job.data;
    const tweets = await this.twitterService.getTwitterData(url, type, id);

    if (!tweets || tweets.length === 0) {
      throw new BadRequestException('Tweet not found');
    }

    return this.notionService.createPage({
      ...job.data,
      tags: job.data.tags ?? [],
      tweets,
    });
  }

  @OnQueueFailed()
  async onFailed(job: JobPayload) {
    console.log(`Job ${job.id} failed with reason ${job.failedReason}`);
    const { callbackUrl, additionalData } = job.data;

    if (!callbackUrl || job.failedReason === 'Navigating frame was detached') {
      return;
    }

    return this.notionService.sendNotification(callbackUrl, {
      type: 'error',
      error: job.failedReason,
      additionalData,
    });
  }
}
