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

  private handleError(error: Error, id: string) {
    if (error.message.includes('Navigating frame was detached')) {
      console.error('Frame detached!! Skipping interaction.');
    } else {
      this.bookmarkNotification.emitError(error, id);
      console.log('[ERROR 2]', error);
      throw error;
    }
  }

  // avoid to use early return when the process likely still continue
  private async getTwitterDataByNetworkHelper(
    payload: GetTweetDataPayload,
    id: string,
  ) {
    const { arrData, isThread, resolve, response, url, page } = payload;
    if (response.url().includes('graphql')) {
      if (
        !response.headers()['content-type'] ||
        !response.headers()['content-type'].includes('application/json')
      ) {
        const text = await response.text();
        console.log('error masok sini yak', text);

        await this.puppeteer.restartBrowser();

        this.bookmarkNotification.emitCompleted(id);
        return resolve([]);
      }

      const _response = await response.json();

      // Tweet not found
      if (!_response?.data?.tweetResult?.result) {
        this.bookmarkNotification.emitCompleted(id);
        return resolve(arrData.reverse());
      }

      const parentTweet =
        _response.data.tweetResult.result.legacy.in_reply_to_status_id_str;
      const data = extractTweetData(_response.data.tweetResult, url);
      arrData.push(data);

      this.bookmarkNotification.emitTweetScraped(data, arrData.length, id);
      console.log({ data, length: arrData.length });

      page.removeAllListeners();
      await page.close();

      // stop condition
      if (!isThread || !parentTweet) {
        this.bookmarkNotification.emitAllTweetScraped(id);
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
              this.getTwitterDataByNetworkHelper(
                {
                  ...payload,
                  response,
                  page: newPage,
                  url: newUrl,
                },
                id,
              ),
          );
          await newPage.goto(newUrl);
        } catch (error) {
          this.handleError(error, id);
        }
      }
    }
  }

  private async getTwitterDataByNetwork(
    url: string,
    isThread: boolean,
    id: string,
  ): Promise<TweetData[]> {
    let resultPromise: Promise<TweetData[]>;

    try {
      const arrData: TweetData[] = [];
      const page = await this.puppeteer.browser.newPage();
      resultPromise = new Promise<TweetData[]>(async (resolve) => {
        page.on(
          'response',
          (response) =>
            response.request().method().toUpperCase() != 'OPTIONS' &&
            this.getTwitterDataByNetworkHelper(
              {
                response,
                resolve,
                page,
                url,
                arrData,
                isThread,
              },
              id,
            ),
        );
      });

      await page.goto(url);
    } catch (error) {
      this.handleError(error, id);
    }

    return resultPromise; // Wait for the Promise to be resolved
  }

  getTwitterData(url: string, type: TwitterDataType, id: string) {
    const isThread = type === TwitterDataType.THREAD;
    return this.getTwitterDataByNetwork(url, isThread, id);
  }
}
