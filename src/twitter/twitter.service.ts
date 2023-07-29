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

  async getTwitterDataByNetwork(url: string) {
    const resultPromise = new Promise((resolve) => {
      this.puppeteer.page.on('response', async (response) => {
        if (response.url().includes('graphql')) {
          const resp = await response.json();
          const temp = resp.data.tweetResult.result;
          const userData = temp.core.user_results.result.legacy;

          // construct data
          const data = {
            name: userData.name,
            username: userData.screen_name,
            text: temp.legacy.full_text,
            photo: temp.legacy.entities.media.map(
              (item) => item.media_url_https,
            ),
          };

          console.log({ data });

          // cancel listen to event
          this.puppeteer.page.removeAllListeners();
          resolve(data); // Resolve the Promise with the data
        }
      });
    });

    await this.puppeteer.page.goto(url);
    const result = await resultPromise; // Wait for the Promise to resolve
    return result;
  }

  async getTwitterData(url: string) {
    return this.getTwitterDataByNetwork(url);
  }
}
