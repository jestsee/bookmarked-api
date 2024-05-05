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
}
