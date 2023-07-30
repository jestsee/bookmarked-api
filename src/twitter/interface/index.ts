import { HTTPResponse } from 'puppeteer';

export interface TweetData {
  name: string;
  username: string;
  text: string;
  url: string;
  photo: string[];
}

export interface GetTweetDataPayload {
  response: HTTPResponse;
  resolve: (value: unknown) => void;
  url: string;
  arrData: TweetData[];
  isThread: boolean;
}
