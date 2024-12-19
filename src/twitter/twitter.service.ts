import { Injectable } from '@nestjs/common';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { GetTweetDataPayload, TweetData } from './interface';
import { TwitterDataType } from './dto';
import { extractTweetData } from './twitter.util';
import { BookmarkNotificationService } from 'src/bookmark-notification/bookmark-notification.service';

@Injectable()
export class TwitterService {
  constructor(
    private readonly puppeteer: PuppeteerService,
    private readonly bookmarkNotification: BookmarkNotificationService,
  ) {}

  private generateNewUrl(url: string, code: string) {
    const lastSlashIndex = url.lastIndexOf('/');
    const newUrl = url.substring(0, lastSlashIndex + 1) + code;
    return newUrl;
  }

  // avoid to use early return when the process likely still continue
  private async getTwitterDataByNetworkHelper(
    payload: GetTweetDataPayload,
    id: string,
  ) {
    const { arrData, isThread, resolve, response, url, page } = payload;
    if (response.url().includes('graphql')) {
      if (!response.headers()['content-type']?.includes('application/json')) {
        const text = await response.text();
        console.log('error masok sini yak', text);

        this.bookmarkNotification.emitCompleted(id);
        await payload.browser.close();
        return resolve([]);
      }

      const _response = await response.json();

      // Tweet not found
      if (!_response?.data?.tweetResult?.result) {
        this.bookmarkNotification.emitCompleted(id);
        await payload.browser.close();
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
        await payload.browser.close();
        resolve(arrData.reverse());
      } else {
        // the recursive call
        const newUrl = this.generateNewUrl(url, parentTweet);
        const newPage = await payload.browser.newPage();
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
        await this.puppeteer.customGoto(newPage, newUrl);
      }
    }
  }

  private async getTwitterDataByNetwork(
    url: string,
    isThread: boolean,
    id: string,
  ): Promise<TweetData[]> {
    const arrData: TweetData[] = [];
    const browser = await this.puppeteer.openBrowser();
    const page = await browser.newPage();

    const resultPromise = new Promise<TweetData[]>((resolve) => {
      page.on(
        'response',
        (response) =>
          response.request().method().toUpperCase() != 'OPTIONS' &&
          this.getTwitterDataByNetworkHelper(
            {
              response,
              resolve,
              browser,
              page,
              url,
              arrData,
              isThread,
            },
            id,
          ),
      );
    });

    await this.puppeteer.customGoto(page, url);

    return resultPromise; // Wait for the Promise to be resolved
  }

  getTwitterData(url: string, type: TwitterDataType, id: string) {
    const isThread = type === TwitterDataType.THREAD;
    return this.getTwitterDataByNetwork(url, isThread, id);
  }
}
