import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, LogLevel } from '@notionhq/client';
import { INotionAccessToken } from 'src/notion/interface';
import { TwitterDataType } from 'src/twitter/dto';
import { TweetData } from 'src/twitter/interface';
import {
  constructCallout,
  constructRichText,
  trimTitleText,
} from './notion-sdk.util';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

@Injectable()
export class NotionSdkService {
  constructor(
    private client: Client,
    private config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.client = new Client({ logLevel: LogLevel.DEBUG }); // TODO remove logger
  }

  async createToken(code: string) {
    const clientId = this.config.get('NOTION_OAUTH_CLIENT_ID');
    const clientSecret = this.config.get('NOTION_OAUTH_CLIENT_SECRET');
    const redirectUri = this.config.get('NOTION_REDIRECT_URI');

    // encode in base 64
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );

    const data = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    };

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${encoded}`,
    };

    return this.httpService.axiosRef.post<null, INotionAccessToken>(
      'https://api.notion.com/v1/oauth/token',
      data,
      { headers },
    );
  }

  async getDatabases(accessToken: string) {
    const response = await this.client.search({
      auth: accessToken,
      filter: { property: 'object', value: 'database' },
    });
    return response;
  }

  createPage(
    accessToken: string,
    databaseId: string,
    tweet: TweetData,
    type: TwitterDataType,
    tags: string[],
  ): Promise<PageObjectResponse> {
    return this.client.pages.create({
      auth: accessToken,
      parent: { database_id: databaseId },
      icon: {
        type: 'external',
        external: {
          url: tweet.avatar,
        },
      },
      properties: {
        Tweet: {
          title: constructRichText({
            ...tweet,
            text: trimTitleText(tweet.text.substring(0, 2000)),
          }),
        },
        Type: {
          select: { name: type.charAt(0).toUpperCase() + type.slice(1) },
        },
        Author: {
          rich_text: [
            {
              type: 'text',
              text: { content: `${tweet.name} (@${tweet.username})` },
            },
          ],
        },
        Tags: {
          multi_select: tags.map((tag) => ({ name: tag })),
        },
        'Tweet Link': {
          url: tweet.url,
        },
        'Tweet Date': {
          date: {
            start: new Date(tweet.date).toISOString(),
          },
        },
      },
    }) as Promise<PageObjectResponse>;
  }

  createBlock(accessToken: string, blockId: string, tweets: TweetData[]) {
    return this.client.blocks.children.append({
      auth: accessToken,
      block_id: blockId,
      children: tweets.map((tweet) => constructCallout(tweet)),
    });
  }
}
