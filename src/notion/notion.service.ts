import { Injectable } from '@nestjs/common';
import { NotionIntegrationDto } from './dto/notion-integration.dto';
import { NotionSdkService } from 'src/notion-sdk/notion-sdk.service';
import { TwitterDataType } from 'src/twitter/dto';
import { TweetData } from 'src/twitter/interface';

@Injectable()
export class NotionService {
  constructor(private readonly notionSdk: NotionSdkService) {}
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

    return { message: 'Tweet successfully bookmarked' };
  }
}
