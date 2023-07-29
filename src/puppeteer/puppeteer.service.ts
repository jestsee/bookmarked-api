import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  private browser: Browser;
  page: Page;

  async onModuleInit() {
    this.browser = await puppeteer.launch({ headless: false });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1080, height: 1024 });
  }

  async onModuleDestroy() {
    await this.browser.close();
  }

  getElementTextContent(selector: string): Promise<string | null> {
    return this.page.$eval(selector, (el) => el.textContent);
  }
}
