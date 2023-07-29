import { Injectable } from '@nestjs/common';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';

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
    console.log({ arrString });
    return arrString.join('');
  }

  async getTweetPhoto(): Promise<string[]> {
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
  }

  async getTwitterData(url: string) {
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
}
