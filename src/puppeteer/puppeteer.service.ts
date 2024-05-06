import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Browser, GoToOptions, Page } from 'puppeteer';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
  browser: Browser;

  constructor(private configService: ConfigService) {}

  // reference
  // https://blog.logrocket.com/setting-headless-chrome-node-js-server-docker/
  async onModuleInit() {
    console.log('onModuleInit called');
    return this.openBrowser();
  }

  async openBrowser() {
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

  async restartBrowser() {
    console.log('masok restart browser');
    await this.browser.close();
    return this.openBrowser();
  }

  async onModuleDestroy() {
    console.log('onModuleDestroy called');
    await this.browser.close();
  }

  /**
   * goto function wrapper to handle detached frame error
   * call this function instead of directly calling page.goto
   * @param page
   * @param url
   * @param options
   */
  async customGoto(page: Page, url: string, options?: GoToOptions) {
    try {
      await page.goto(url, options);
    } catch (error) {
      if (!error.message.includes('Navigating frame was detached')) {
        console.error('[ERROR goto]', error);
        throw error;
      }
      console.error('Frame detached!! Skipping interaction.');
    }
  }
}
