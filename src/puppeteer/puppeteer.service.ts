import { Injectable, OnModuleInit } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';

// TODO refactor bikin twitter service, pinterest service, instagram service
@Injectable()
export class PuppeteerService implements OnModuleInit {
  private browser: Browser;
  private page: Page;

  async onModuleInit() {
    this.browser = await puppeteer.launch({ headless: false });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1080, height: 1024 });
  }

  getElementTextContent(selector: string): Promise<string | null> {
    return this.page.$eval(selector, (el) => el.textContent);
  }

  // TODO ada beberapa yg harusnya gosah spasi tp malah ada spasinya
  async getTweetText(): Promise<string> {
    const arrString = await this.page.$$eval(
      'div[data-testid="tweetText"] span, img',
      (options) => {
        return options.map((option) => {
          if (option.tagName === 'IMG') return option.getAttribute('alt');
          return option.textContent;
        });
      },
    );
    console.log({ arrString });
    return arrString.join('');
  }

  async getTwitterData(url: string) {
    await this.page.goto(url);
    await this.page.waitForSelector('div[data-testid="tweetText"] span');

    // get tweet text
    const tweet = await this.getTweetText();

    // get author's information
    const author = await this.getElementTextContent(
      'div[data-testid="User-Name"] span:last-child',
    );

    const username = await this.getElementTextContent(
      'div[data-testid="User-Name"] div:nth-child(2) div span:last-child',
    );

    return { tweet, author, username };
  }
}
