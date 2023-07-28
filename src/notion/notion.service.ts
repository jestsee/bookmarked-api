import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotionIntegrationDto } from './dto/notion-integration.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { NotionSdkService } from 'src/notion-sdk/notion-sdk.service';

@Injectable()
export class NotionService {
  constructor(
    private prisma: PrismaService,
    private readonly notionSdk: NotionSdkService,
  ) {}
  // https://developers.notion.com/docs/authorization#prompt-for-a-standard-integration-with-no-template-option-default
  async getAccessToken(
    { code }: NotionIntegrationDto,
    @GetUser() user: User,
  ): Promise<{
    access_token: string;
  }> {
    try {
      const response = await this.notionSdk.createToken(code);

      // get the access token
      const tokenInfo = response.data;

      // update or store notion token info on db
      const notionData = {
        accessToken: tokenInfo.access_token,
        botId: tokenInfo.bot_id,
        duplicatedTemplateId: tokenInfo.duplicate_template_id,
        tokenType: tokenInfo.token_type,
        workspaceId: tokenInfo.workspace_id,
        workspaceName: tokenInfo.workspace_name,
        userId: user.id,
      };

      await this.prisma.notion.upsert({
        where: { userId: user.id },
        create: notionData,
        update: notionData,
      });

      return { access_token: tokenInfo.access_token };
    } catch (error) {
      throw new ForbiddenException(
        error.response.data.error_description as string,
      );
    }
  }

  async getDatabases(@GetUser() user: User) {
    const { accessToken } = await this.prisma.notion.findUnique({
      where: { userId: user.id },
      select: { accessToken: true },
    });
    return this.notionSdk.getDatabases(accessToken);
  }
}
