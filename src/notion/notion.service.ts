import { Injectable } from '@nestjs/common';
import { NotionIntegrationDto } from './dto/notion-integration.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

// https://developers.notion.com/docs/authorization#prompt-for-a-standard-integration-with-no-template-option-default
@Injectable()
export class NotionService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private readonly httpService: HttpService,
  ) {}
  async getAccessToken({ code }: NotionIntegrationDto): Promise<{
    access_token: string;
  }> {
    try {
      const clientId = this.config.get('NOTION_OAUTH_CLIENT_ID');
      const clientSecret = this.config.get('NOTION_OAUTH_CLIENT_SECRET');
      const redirectUri = this.config.get('NOTION_REDIRECT_URI');

      console.log({ clientId, clientSecret });

      // encode in base 64
      const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );

      const response = await this.httpService.axiosRef.post<
        string,
        {
          access_token: string;
        }
      >(
        'https://api.notion.com/v1/oauth/token',
        {
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Basic ${encoded}`,
          },
        },
      );

      console.log({ response });
      return response;
    } catch (error) {
      console.error({ error: error.response.data });
    }
  }
  // TODO still error
  // example for success response from notion API
  // data: {
  //   access_token: 'secret_onpN4l4al4fdT5heFtgcR48FEofReRZO6nX9t1RXSTz',
  //   token_type: 'bearer',
  //   bot_id: '3e2aeee7-c14b-4295-b834-febdccbfb6a1',
  //   workspace_name: "Jesica's Notion",
  //   workspace_icon: 'https://lh3.googleusercontent.com/a-/AOh14GiOJxym9rV9Qc_G78OgM712SU6koYEYdzZbAnMK=s100',
  //   workspace_id: '1e66ba03-a88e-411e-aef0-1b9581be3f9f',
  //   owner: [Object],
  //   duplicated_template_id: null
  // }
}
