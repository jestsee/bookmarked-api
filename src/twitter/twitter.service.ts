import { Injectable } from '@nestjs/common';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { GetTweetDataPayload, TweetData } from './interface';
import { TwitterDataType } from './dto';
import { extractTweetData } from './twitter.util';
import { BookmarkNotificationService } from 'src/bookmark-notification/bookmark-notification.service';

@Injectable()
export class TwitterService {
  constructor(
    private puppeteer: PuppeteerService,
    private bookmarkNotification: BookmarkNotificationService,
  ) {}

  private generateNewUrl(url: string, code: string) {
    const lastSlashIndex = url.lastIndexOf('/');
    const newUrl = url.substring(0, lastSlashIndex + 1) + code;
    return newUrl;
  }

  private async getTwitterDataByNetworkHelper(payload: GetTweetDataPayload) {
    const { arrData, isThread, resolve, response, url, page } = payload;
    if (response.url().includes('graphql')) {
      if (
        !response.headers()['content-type'] ||
        !response.headers()['content-type'].includes('application/json')
      ) {
        this.bookmarkNotification.emitCompleted();
        return resolve([]);
      }

      const _response = await response.json();

      // Tweet not found
      if (!_response?.data?.tweetResult?.result) {
        this.bookmarkNotification.emitCompleted();
        return resolve(arrData.reverse());
      }

      const parentTweet =
        _response.data.tweetResult.result.legacy.in_reply_to_status_id_str;
      const data = extractTweetData(_response.data.tweetResult, url);
      arrData.push(data);

      this.bookmarkNotification.emitTweetScraped(data, arrData.length);
      console.log({ data, length: arrData.length });

      page.removeAllListeners();
      await page.close();

      // stop condition
      if (!isThread || !parentTweet) {
        this.bookmarkNotification.emitCompleted();
        resolve(arrData.reverse());
      } else {
        // recursive function
        try {
          const newUrl = this.generateNewUrl(url, parentTweet);
          const newPage = await this.puppeteer.browser.newPage();
          newPage.on(
            'response',
            (response) =>
              response.request().method().toUpperCase() != 'OPTIONS' &&
              this.getTwitterDataByNetworkHelper({
                ...payload,
                response,
                page: newPage,
                url: newUrl,
              }),
          );
          await newPage.goto(newUrl);
        } catch (error) {
          this.bookmarkNotification.emitError(error);
          console.log('[ERROR]', error);
        }
      }
    }
  }

  private async getTwitterDataByNetwork(
    url: string,
    isThread: boolean,
  ): Promise<TweetData[]> {
    const arrData: TweetData[] = [];
    const page = await this.puppeteer.browser.newPage();
    const resultPromise = new Promise<TweetData[]>(async (resolve) => {
      page.on(
        'response',
        (response) =>
          response.request().method().toUpperCase() != 'OPTIONS' &&
          this.getTwitterDataByNetworkHelper({
            response,
            resolve,
            page,
            url,
            arrData,
            isThread,
          }),
      );
    });

    await page.goto(url);
    const result = await resultPromise; // Wait for the Promise to be resolved
    return result;
  }

  getTwitterData(url: string, type: TwitterDataType) {
    return this.getTwitterDataByNetwork(url, type === TwitterDataType.THREAD);
  }
}
