import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { TwitterService } from 'src/twitter/twitter.service';
import { NotionService } from './notion.service';
import { NOTION, NOTION_JOB } from './notion.constant';
import { BadRequestException } from '@nestjs/common';
import { NotionJobPayload } from './interface';

@Processor(NOTION)
export class NotionConsumer {
  constructor(
    private notionService: NotionService,
    private twitterService: TwitterService,
  ) {}

  @Process({ name: NOTION_JOB, concurrency: 4 })
  async bookmarkTweet(job: Job<NotionJobPayload>) {
    const { accessToken, databaseId, tags, type, url, id } = job.data;
    const tweets = await this.twitterService.getTwitterData(url, type, id);

    if (!tweets || tweets.length === 0) {
      throw new BadRequestException('Tweet not found');
    }

    return this.notionService.createPage(
      accessToken,
      databaseId,
      tweets,
      id,
      tags,
    );
  }
}
