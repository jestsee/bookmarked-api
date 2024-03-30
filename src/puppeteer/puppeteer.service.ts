import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Browser } from 'puppeteer';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  browser: Browser;

  constructor(private configService: ConfigService) {}

  // reference
  // https://blog.logrocket.com/setting-headless-chrome-node-js-server-docker/
  async onModuleInit() {
    console.log('onModuleInit called');
    this.browser = await puppeteer.launch({
      headless: true,
      executablePath: this.configService.get<string>('BROWSER_PATH'),
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--disable-features=site-per-process',
      ],
    });
  }

  async onModuleDestroy() {
    console.log('onModuleDestroy called');
    await this.browser.close();
  }

  // async resetPage() {
  //   await this.page.close();
  //   this.page = await this.browser.newPage();
  // }

  // getElementTextContent(selector: string): Promise<string | null> {
  //   return this.page.$eval(selector, (el) => el.textContent);
  // }
}
