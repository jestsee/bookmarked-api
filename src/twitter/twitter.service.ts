import { Injectable } from '@nestjs/common';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { GetTweetDataPayload, TweetData } from './interface';
import { TwitterDataType } from './dto';
import { extractTweetData } from './twitter.util';

@Injectable()
export class TwitterService {
  constructor(private puppeteer: PuppeteerService) {}

  async getTweetText(): Promise<string> {
    const arrString = await this.puppeteer.page.$$eval(
      'div[data-testid="tweetText"] span, img',
      (elements) => {
        return elements.map((el) => {
          if (el.tagName === 'IMG') return el.getAttribute('alt');
          return el.textContent;
        });
      },
    );
    return arrString.join('');
  }

  async getTweetPhoto(): Promise<string[]> {
    try {
      await this.puppeteer.page.waitForSelector(
        'div[data-testid="tweetPhoto"] > img',
        { timeout: 2000 },
      );
      const arrUrl = await this.puppeteer.page.$$eval(
        'div[data-testid="tweetPhoto"] > img',
        (elements) => {
          return elements.map((el) => {
            return el.getAttribute('src');
          });
        },
      );
      return arrUrl;
    } catch (error) {
      return [];
    }
  }

  async getTwitterDataByHtml(url: string) {
    await this.puppeteer.page.goto(url);
    await this.puppeteer.page.waitForSelector(
      'div[data-testid="tweetText"] span',
    );

    // get tweet text
    const tweet = await this.getTweetText();

    // get author's name
    const author = await this.puppeteer.getElementTextContent(
      'div[data-testid="User-Name"] span:last-child',
    );

    // get author's username
    const username = await this.puppeteer.getElementTextContent(
      'div[data-testid="User-Name"] div:nth-child(2) div span:last-child',
    );

    // get tweet's photos
    const photos = await this.getTweetPhoto();

    return { tweet, author, username, photos };
  }

  generateNewUrl(url: string, code: string) {
    const lastSlashIndex = url.lastIndexOf('/');
    const newUrl = url.substring(0, lastSlashIndex + 1) + code;
    return newUrl;
  }

  async getTwitterDataByNetworkHelper(payload: GetTweetDataPayload) {
    const { arrData, isThread, resolve, response, url } = payload;
    if (response.url().includes('graphql')) {
      // deconstruct response
      const _response = await response.json();
      const parentTweet =
        _response.data.tweetResult.result.legacy.in_reply_to_status_id_str;
      const data = extractTweetData(_response.data.tweetResult, url);

      console.log({ data });
      arrData.push(data);

      this.puppeteer.page.removeAllListeners();
      await this.puppeteer.resetPage();

      // stop condition
      if (!isThread || !parentTweet) {
        resolve(arrData.reverse());
      } else {
        // recursive function
        const newUrl = this.generateNewUrl(url, parentTweet);
        this.puppeteer.page.on(
          'response',
          (response) =>
            response.request().method().toUpperCase() != 'OPTIONS' &&
            this.getTwitterDataByNetworkHelper({
              ...payload,
              response,
              url: newUrl,
            }),
        );
        await this.puppeteer.page.goto(newUrl);
      }
    }
  }

  async getTwitterDataByNetwork(
    url: string,
    isThread: boolean,
  ): Promise<TweetData[]> {
    const arrData: TweetData[] = [];
    const resultPromise = new Promise<TweetData[]>((resolve) => {
      this.puppeteer.page.on(
        'response',
        (response) =>
          response.request().method().toUpperCase() != 'OPTIONS' &&
          this.getTwitterDataByNetworkHelper({
            response,
            resolve,
            url,
            arrData,
            isThread,
          }),
      );
    });

    await this.puppeteer.page.goto(url);
    const result = await resultPromise; // Wait for the Promise to resolve
    return result;
  }

  async getTwitterData(url: string, type: TwitterDataType) {
    return this.getTwitterDataByNetwork(url, type === TwitterDataType.THREAD);
  }
}
