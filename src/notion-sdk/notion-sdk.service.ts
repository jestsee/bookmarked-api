import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, LogLevel } from '@notionhq/client';
import { INotionAccessToken } from 'src/notion/interface';

@Injectable()
export class NotionSdkService {
  constructor(
    private client: Client,
    private config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.client = new Client({ logLevel: LogLevel.DEBUG });
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

  // TODO when the accessToken expire?
  async getDatabases(accessToken: string) {
    const response = await this.client.search({
      auth: accessToken,
      filter: { property: 'object', value: 'database' },
    });
    return response;
  }
}
