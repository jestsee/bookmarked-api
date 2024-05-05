import { GetTweetDataDto } from 'src/twitter/dto';

export interface INotionAccessToken {
  data: {
    access_token: string;
    token_type: string;
    bot_id: string;
    workspace_name: string;
    workspace_icon: string;
    workspace_id: string;
    duplicate_template_id?: string;
  };
}

export interface NotionJobPayload extends GetTweetDataDto {
  id: string;
  accessToken: string;
}

export type NotionData = {
  notionPageUrl: string;
  author: string;
  username: string;
  tweetUrl: string;
  text: string;
  additionalData?: object;
};

export type NotificationPayload =
  | ({ type: 'success' } & NotionData)
  | { type: 'error'; error: string; additionalData?: object };
