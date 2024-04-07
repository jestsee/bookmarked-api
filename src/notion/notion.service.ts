import { Injectable, NotFoundException } from '@nestjs/common';
import { NotionIntegrationDto } from './dto/notion-integration.dto';
import { NotionSdkService } from 'src/notion-sdk/notion-sdk.service';
import { GetTweetDataDto, TwitterDataType } from 'src/twitter/dto';
import { TweetData } from 'src/twitter/interface';
import { Queue } from 'bull';
import { MAP_JOB_STATUS, NOTION, NOTION_JOB } from './notion.constant';
import { InjectQueue } from '@nestjs/bull';
import { BookmarkNotificationService } from 'src/bookmark-notification/bookmark-notification.service';

@Injectable()
export class NotionService {
  constructor(
    @InjectQueue(NOTION) private readonly notionQueue: Queue,
    private readonly notionSdk: NotionSdkService,
    private bookmarkNotification: BookmarkNotificationService,
  ) {
    this.notionQueue.on('error', (error) => {
      console.log('[QUEUE ERROR]', error);
    });
  }

  // https://developers.notion.com/docs/authorization#prompt-for-a-standard-integration-with-no-template-option-default
  async getAccessToken({ code }: NotionIntegrationDto): Promise<{
    access_token: string;
  }> {
    const response = await this.notionSdk.createToken(code);
    const { access_token } = response.data;

    return { access_token };
  }

  async getDatabase(accessToken: string) {
    const [database] = (await this.notionSdk.getDatabases(accessToken)).results;
    return database;
  }

  async createPage(
    accessToken: string,
    databaseId: string,
    tweets: TweetData[],
    tag: string[] = [],
  ) {
    const firstTweet = tweets.at(0);
    const page = await this.notionSdk.createPage(
      accessToken,
      databaseId,
      firstTweet,
      tweets.length > 1 ? TwitterDataType.THREAD : TwitterDataType.TWEET,
      tag,
    );

    await this.notionSdk.createBlock(accessToken, page.id, tweets);
    this.bookmarkNotification.emitSentToNotion();
    this.bookmarkNotification.emitCompleted();

    return { message: 'Tweet successfully bookmarked' };
  }

  async bookmarkTweet(accessToken: string, payload: GetTweetDataDto) {
    let { url } = payload;
    const PROTOCOLS = 'https://';

    if (!url.includes(PROTOCOLS) && !url.includes('http://')) {
      url = PROTOCOLS + url;
    }

    const job = await this.notionQueue.add(NOTION_JOB, {
      ...payload,
      url,
      accessToken,
    });

    return { id: job.id };
  }

  async checkProgress(taskId: string) {
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

  async retry(taskId: string) {
    const job = await this.notionQueue.getJob(taskId);

    if (!job) throw new NotFoundException('Task not found');

    await job.retry();

    return { message: 'In the process of retrying' };
  }
}
