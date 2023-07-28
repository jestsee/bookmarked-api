import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotionIntegrationDto } from './dto/notion-integration.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { INotionAccessToken } from './interface';

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
        INotionAccessToken
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
      const tokenInfo = response.data;

      // update or store notion token info on db
      await this.prisma.notion.upsert({
        where: { userId: user.id },
        update: {
          accessToken: tokenInfo.access_token,
          botId: tokenInfo.bot_id,
          duplicatedTemplateId: tokenInfo.duplicate_template_id,
          tokenType: tokenInfo.token_type,
          workspaceId: tokenInfo.workspace_id,
          workspaceName: tokenInfo.workspace_name,
        },
        create: {
          accessToken: tokenInfo.access_token,
          botId: tokenInfo.bot_id,
          duplicatedTemplateId: tokenInfo.duplicate_template_id,
          tokenType: tokenInfo.token_type,
          workspaceId: tokenInfo.workspace_id,
          workspaceName: tokenInfo.workspace_name,
          userId: user.id,
        },
      });

      return { access_token: response.data.access_token };
    } catch (error) {
      throw new ForbiddenException(
        error.response.data.error_description as string,
      );
    }
  }
}
