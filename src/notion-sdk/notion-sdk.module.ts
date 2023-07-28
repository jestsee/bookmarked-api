import { Global, Module } from '@nestjs/common';
import { NotionSdkService } from './notion-sdk.service';
import { Client } from '@notionhq/client';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [Client, HttpModule],
  providers: [NotionSdkService, Client],
  exports: [NotionSdkService],
})
export class NotionSdkModule {}
