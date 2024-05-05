import { Injectable, NotFoundException } from '@nestjs/common';
import { NotionIntegrationDto } from './dto/notion-integration.dto';
import { NotionSdkService } from 'src/notion-sdk/notion-sdk.service';
import { GetTweetDataDto, TwitterDataType } from 'src/twitter/dto';
import { TweetData } from 'src/twitter/interface';
import { Queue } from 'bull';
import { MAP_JOB_STATUS, NOTION, NOTION_JOB } from './notion.constant';
import { InjectQueue } from '@nestjs/bull';
import { BookmarkNotificationService } from 'src/bookmark-notification/bookmark-notification.service';
import { v4 as uuidv4 } from 'uuid';
import { NotificationPayload, NotionData, NotionJobPayload } from './interface';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class NotionService {
  constructor(
    @InjectQueue(NOTION) private readonly notionQueue: Queue,
    private readonly notionSdk: NotionSdkService,
    private bookmarkNotification: BookmarkNotificationService,
    private readonly httpService: HttpService,
  ) {}

  // https://developers.notion.com/docs/authorization#prompt-for-a-standard-integration-with-no-template-option-default
  async getAccessToken({ code }: NotionIntegrationDto): Promise<{
    access_token: string;
  }> {
    const response = await this.notionSdk.createToken(code);
    const { access_token } = response.data;

    return { access_token };
  }

  async sendNotification(callbackUrl: string, data: NotificationPayload) {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      return this.httpService.axiosRef.post<null, null, NotificationPayload>(
        callbackUrl,
        data,
        { headers },
      );
    } catch (error) {
      console.error('error sending notification', error);
    }
  }

  async getDatabase(accessToken: string) {
    const [database] = (await this.notionSdk.getDatabases(accessToken)).results;
    return database;
  }

  async createPage(
    params: Omit<NotionJobPayload, 'type' | 'url'> & {
      tweets: TweetData[];
    },
  ) {
    const { tweets, accessToken, databaseId, tags, id, callbackUrl } = params;
    const firstTweet = tweets.at(0);
    try {
      const page = await this.notionSdk.createPage(
        accessToken,
        databaseId,
        firstTweet,
        tweets.length > 1 ? TwitterDataType.THREAD : TwitterDataType.TWEET,
        tags,
      );

      await this.notionSdk.createBlock(accessToken, page.id, tweets);

      this.bookmarkNotification.emitSentToNotion(id, page.url);
      this.bookmarkNotification.emitCompleted(id);

      if (callbackUrl) {
        const data: NotionData = {
          author: tweets[0].name,
          notionPageUrl: page.url,
          text: tweets[0].text,
          tweetUrl: tweets[0].url,
          username: tweets[0].username,
          ...(params.additionalData && {
            additionalData: params.additionalData,
          }),
        };
        await this.sendNotification(callbackUrl, { type: 'success', ...data });
      }
    } catch (error) {
      console.error('error page', error);
      this.bookmarkNotification.emitError(error.message, id);
      throw error;
    }
  }

  async bookmarkTweet(accessToken: string, payload: GetTweetDataDto) {
    let { url } = payload;
    const PROTOCOLS = 'https://';

    if (!url.includes(PROTOCOLS) && !url.includes('http://')) {
      url = PROTOCOLS + url;
    }

    const id = uuidv4();

    const job = await this.notionQueue.add(
      NOTION_JOB,
      {
        ...payload,
        url,
        accessToken,
        id,
      },
      { jobId: id },
    );

    return { id: job.id };
  }

  async checkProgressWithSSE(taskId: string) {
    const job = await this.notionQueue.getJob(taskId);

    if (!job) {
      throw new NotFoundException('Task not found');
    }

    return this.bookmarkNotification.subscribe(taskId);
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

    return { message: 'Making another attempt' };
  }
}
