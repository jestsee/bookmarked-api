import { HTTPResponse } from 'puppeteer';

export interface TweetData {
  name: string;
  username: string;
  avatar?: string;
  text: string;
  url: string;
  photo: string[];
  quotedTweet?: TweetData;
  urls: TweetUrl[];
}

export interface TweetUrl {
  display_url: string;
  expanded_url: string;
  url: string;
}

export interface GetTweetDataPayload {
  response: HTTPResponse;
  resolve: (value: unknown) => void;
  url: string;
  arrData: TweetData[];
  isThread: boolean;
}
