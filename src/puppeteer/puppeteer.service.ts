import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  private browser: Browser;
  page: Page;

  async onModuleInit() {
    console.log('onModuleInit called');
    this.browser = await puppeteer.launch({
      headless: false,
      // executablePath: '/usr/bin/google-chrome',
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
