import { HTTPResponse } from 'puppeteer';

export interface TweetData {
  name: string;
  username: string;
  avatar?: string;
  text: string;
  url: string;
  quotedTweet?: TweetData;
  urls: TweetUrl[];
  media: TweetMedia[];
  inlineMedia?: string[];
}

export interface TweetUrl {
  display_url: string;
  expanded_url: string;
  url: string;
}

export interface TweetMedia extends TweetUrl {
  media_url_https: string;
  id_str: string;
}

export interface InlineMedia {
  media_id: string;
  index: number;
}

export interface GetTweetDataPayload {
  response: HTTPResponse;
  resolve: (value: unknown) => void;
  url: string;
  arrData: TweetData[];
  isThread: boolean;
}
