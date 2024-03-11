import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { TwitterService } from 'src/twitter/twitter.service';
import { NotionService } from './notion.service';
import { NOTION, NOTION_JOB } from './notion.constant';
import { BadRequestException } from '@nestjs/common';

@Processor(NOTION)
export class NotionConsumer {
  constructor(
    private notionService: NotionService,
    private twitterService: TwitterService,
  ) {}

  @Process({ name: NOTION_JOB, concurrency: 2 })
  async bookmarkTweet(job: Job) {
    const tweets = await this.twitterService.getTwitterData(
      job.data.url,
      job.data.type,
    );

    if (!tweets || tweets.length === 0) {
      throw new BadRequestException('Tweet not found');
    }

    return this.notionService.createPage(
      job.data.accessToken,
      job.data.databaseId,
      tweets,
      job.data.tags,
    );
  }
}
