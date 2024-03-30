import { Injectable } from '@nestjs/common';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { GetTweetDataPayload, TweetData } from './interface';
import { TwitterDataType } from './dto';
import { extractTweetData } from './twitter.util';

@Injectable()
export class TwitterService {
  constructor(private puppeteer: PuppeteerService) {}

  // async getTweetText(): Promise<string> {
  //   const arrString = await this.puppeteer.page.$$eval(
  //     'div[data-testid="tweetText"] span, img',
  //     (elements) => {
  //       return elements.map((el) => {
  //         if (el.tagName === 'IMG') return el.getAttribute('alt');
  //         return el.textContent;
  //       });
  //     },
  //   );
  //   return arrString.join('');
  // }

  // async getTweetPhoto(): Promise<string[]> {
  //   try {
  //     await this.puppeteer.page.waitForSelector(
  //       'div[data-testid="tweetPhoto"] > img',
  //       { timeout: 2000 },
  //     );
  //     const arrUrl = await this.puppeteer.page.$$eval(
  //       'div[data-testid="tweetPhoto"] > img',
  //       (elements) => {
  //         return elements.map((el) => {
  //           return el.getAttribute('src');
  //         });
  //       },
  //     );
  //     return arrUrl;
  //   } catch (error) {
  //     return [];
  //   }
  // }

  // async getTwitterDataByHtml(url: string) {
  //   await this.puppeteer.page.goto(url);
  //   await this.puppeteer.page.waitForSelector(
  //     'div[data-testid="tweetText"] span',
  //   );

  //   // get tweet text
  //   const tweet = await this.getTweetText();

  //   // get author's name
  //   const author = await this.puppeteer.getElementTextContent(
  //     'div[data-testid="User-Name"] span:last-child',
  //   );

  //   // get author's username
  //   const username = await this.puppeteer.getElementTextContent(
  //     'div[data-testid="User-Name"] div:nth-child(2) div span:last-child',
  //   );

  //   // get tweet's photos
  //   const photos = await this.getTweetPhoto();

  //   return { tweet, author, username, photos };
  // }

  generateNewUrl(url: string, code: string) {
    const lastSlashIndex = url.lastIndexOf('/');
    const newUrl = url.substring(0, lastSlashIndex + 1) + code;
    return newUrl;
  }

  async getTwitterDataByNetworkHelper(payload: GetTweetDataPayload) {
    const { arrData, isThread, resolve, response, url, page } = payload;
    if (response.url().includes('graphql')) {
      if (
        !response.headers()['content-type'] ||
        !response.headers()['content-type'].includes('application/json')
      ) {
        return resolve([]);
      }

      const _response = await response.json();

      // Tweet not found
      if (!_response?.data?.tweetResult?.result) {
        return resolve([]);
      }

      const parentTweet =
        _response.data.tweetResult.result.legacy.in_reply_to_status_id_str;
      const data = extractTweetData(_response.data.tweetResult, url);

      console.log({ data, length: arrData.length });
      arrData.push(data);

      page.removeAllListeners();
      await page.close();

      // stop condition
      if (!isThread || !parentTweet) {
        resolve(arrData.reverse());
      } else {
        // recursive function
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
      }
    }
  }

  async getTwitterDataByNetwork(
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

  async getTwitterData(url: string, type: TwitterDataType) {
    return this.getTwitterDataByNetwork(url, type === TwitterDataType.THREAD);
  }
}
