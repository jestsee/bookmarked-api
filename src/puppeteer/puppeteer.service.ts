import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { GoToOptions, Page } from 'puppeteer';

@Injectable()
export class PuppeteerService {
  constructor(private configService: ConfigService) {}

  openBrowser() {
    return puppeteer.launch({
      headless: true,
      executablePath: this.configService.get<string>('BROWSER_PATH'),
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--disable-features=site-per-process',
      ],
    });
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
