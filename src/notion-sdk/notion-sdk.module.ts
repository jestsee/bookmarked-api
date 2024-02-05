import { Global, Module } from '@nestjs/common';
import { NotionSdkService } from './notion-sdk.service';
import { Client } from '@notionhq/client';
import { HttpModule } from '@nestjs/axios';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { NotionSDKErrorInterceptor } from 'src/interceptor/notion-sdk-error.interceptor';

@Global()
@Module({
  imports: [Client, HttpModule],
  providers: [
    NotionSdkService,
    Client,
    { provide: APP_INTERCEPTOR, useClass: NotionSDKErrorInterceptor },
  ],
  exports: [NotionSdkService],
})
export class NotionSdkModule {}
