import { Browser, HTTPResponse, Page } from 'puppeteer';

export interface TweetData {
  name: string;
  username: string;
  avatar?: string;
  date: string;
  text: string;
  url: string;
  quotedTweet?: TweetData;
  urls: TweetUrl[];
  media: TweetMedia[];
  video: TweetVideoVariant[];
  inlineMedia?: string[];
}

export interface TweetUrl {
  display_url: string;
  expanded_url: string;
  url: string;
}

export interface TweetVideoVariant {
  bitrate?: number;
  content_type: string;
  url: string;
}

export interface TweetMedia extends TweetUrl {
  media_url_https: string;
  id_str: string;
  video_info: {
    variants: TweetVideoVariant[];
  };
}

export interface InlineMedia {
  media_id: string;
  index: number;
}

export interface GetTweetDataPayload {
  response: HTTPResponse;
  resolve: (value: unknown) => void;
  browser: Browser;
  page: Page;
  url: string;
  arrData: TweetData[];
  isThread: boolean;
}
