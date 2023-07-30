import { Injectable } from '@nestjs/common';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { GetTweetDataPayload, TweetData } from './interface';
import { TwitterDataType } from './dto';

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
      console.log({ arrUrl });
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
      const resp = await response.json();
      const temp = resp.data.tweetResult.result;
      const userData = temp.core.user_results.result.legacy;

      // construct data
      const data = {
        name: userData.name,
        username: userData.screen_name,
        text: temp.legacy.full_text,
        url,
        photo:
          temp.legacy.entities.media?.map((item) => item.media_url_https) ?? [],
      };

      console.log({ data });
      arrData.push(data);

      // stop condition
      if (!isThread || !temp.legacy.in_reply_to_status_id_str) {
        this.puppeteer.page.removeAllListeners();
        resolve(arrData.reverse());
      } else {
        // recursive function
        this.puppeteer.page.removeAllListeners();
        await this.puppeteer.resetPage();
        const newUrl = this.generateNewUrl(
          url,
          temp.legacy.in_reply_to_status_id_str,
        );
        this.puppeteer.page.on(
          'response',
          async (response) =>
            await this.getTwitterDataByNetworkHelper({
              ...payload,
              response,
              url: newUrl,
            }),
        );
        await this.puppeteer.page.goto(newUrl);
      }
    }
  }

  async getTwitterDataByNetwork(url: string, isThread: boolean) {
    const arrData: TweetData[] = [];
    const resultPromise = new Promise((resolve) => {
      this.puppeteer.page.on(
        'response',
        async (response) =>
          await this.getTwitterDataByNetworkHelper({
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
