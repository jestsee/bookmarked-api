import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  private browser: Browser;
  page: Page;

  // reference
  // https://blog.logrocket.com/setting-headless-chrome-node-js-server-docker/
  async onModuleInit() {
    console.log('onModuleInit called');
    this.browser = await puppeteer.launch({
      headless: true,
      // executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-gpu'],
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1080, height: 1024 });
  }

  async onModuleDestroy() {
    console.log('onModuleDestroy called');
    await this.browser.close();
  }

  async resetPage() {
    await this.page.close();
    this.page = await this.browser.newPage();
  }

  getElementTextContent(selector: string): Promise<string | null> {
    return this.page.$eval(selector, (el) => el.textContent);
  }
}
