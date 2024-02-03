import { BadRequestException, Injectable } from '@nestjs/common';
import { NotionIntegrationDto } from './dto/notion-integration.dto';
// import { PrismaService } from 'src/prisma/prisma.service';
import { GetUser } from 'src/auth/decorator';
import { User } from '@prisma/client';
import { NotionSdkService } from 'src/notion-sdk/notion-sdk.service';
import { TwitterDataType } from 'src/twitter/dto';
import { TweetData } from 'src/twitter/interface';

@Injectable()
export class NotionService {
  constructor(
    // private prisma: PrismaService,
    private readonly notionSdk: NotionSdkService,
  ) {}
  // https://developers.notion.com/docs/authorization#prompt-for-a-standard-integration-with-no-template-option-default
  async getAccessToken({ code }: NotionIntegrationDto): Promise<{
    access_token: string;
  }> {
    try {
      const response = await this.notionSdk.createToken(code);

      // get the access token
      const tokenInfo = response.data;

      // update or store notion token info on db
      // const notionData = {
      //   accessToken: tokenInfo.access_token,
      //   botId: tokenInfo.bot_id,
      //   duplicatedTemplateId: tokenInfo.duplicate_template_id,
      //   tokenType: tokenInfo.token_type,
      //   workspaceId: tokenInfo.workspace_id,
      //   workspaceName: tokenInfo.workspace_name,
      //   userId: user.id,
      // };

      // await this.prisma.notion.upsert({
      //   where: { userId: user.id },
      //   create: notionData,
      //   update: notionData,
      // });

      return { access_token: tokenInfo.access_token };
    } catch (error) {
      throw new BadRequestException(
        error.response.data.error_description as string,
      );
    }
  }

  async getDatabase(accessToken: string) {
    // const { accessToken, id } = await this.prisma.notion.findUnique({
    //   where: { userId: user.id },
    //   select: { accessToken: true, id: true },
    // });
    const [database] = (await this.notionSdk.getDatabases(accessToken)).results;

    // update notion info on db
    // const updatedData = await this.prisma.notion.update({
    //   where: { id },
    //   data: { databaseId: database.id },
    // });

    // TODO only save the id from database which has required properties
    return database;
  }

  async createPage(
    // @GetUser() user: User,
    accessToken: string,
    databaseId: string,
    tweets: TweetData[],
    tag: string[] = [],
  ) {
    // const { accessToken, databaseId } = await this.prisma.notion.findUnique({
    //   where: { userId: user.id },
    //   select: { accessToken: true, databaseId: true },
    // });
    const firstTweet = tweets.at(0);
    const page = await this.notionSdk.createPage(
      accessToken,
      databaseId,
      firstTweet,
      tweets.length > 1 ? TwitterDataType.THREAD : TwitterDataType.TWEET,
      tag,
    );

    await this.notionSdk.createBlock(accessToken, page.id, tweets);

    return {
      message: 'Tweet successfully bookmarked',
    };
  }
}
