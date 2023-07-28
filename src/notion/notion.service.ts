import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotionIntegrationDto } from './dto/notion-integration.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';

// https://developers.notion.com/docs/authorization#prompt-for-a-standard-integration-with-no-template-option-default
@Injectable()
export class NotionService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private readonly httpService: HttpService,
  ) {}
  async getAccessToken(
    { code }: NotionIntegrationDto,
    @GetUser() user: User,
  ): Promise<{
    access_token: string;
  }> {
    try {
      const clientId = this.config.get('NOTION_OAUTH_CLIENT_ID');
      const clientSecret = this.config.get('NOTION_OAUTH_CLIENT_SECRET');
      const redirectUri = this.config.get('NOTION_REDIRECT_URI');

      // encode in base 64
      const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );

      const response = await this.httpService.axiosRef.post<
        null,
        { data: { access_token: string } }
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

      // get the access token
      const accessToken = response.data.access_token;

      // update access token on user data
      await this.prisma.user.update({
        where: { id: user.id },
        data: { notionAccessToken: accessToken },
      });

      return { access_token: response.data.access_token };
    } catch (error) {
      throw new ForbiddenException(
        error.response.data.error_description as string,
      );
    }
  }
}
